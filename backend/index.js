const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { query } = require('./db');
const Queue = require('bull');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure export directory exists
const EXPORT_DIR = path.join(__dirname, 'exports');
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR);


const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for simpler demo environments
}));

// Request Logging
app.use(morgan('dev'));

app.use(cors());
app.use(express.json());
app.use('/exports', express.static(EXPORT_DIR));


const exportQueue = new Queue('export', process.env.REDIS_URL);

// ---------- Helper: Verify tenant API key ----------
async function verifyTenant(apiKey) {
  const res = await query('SELECT id, name FROM tenants WHERE api_key = $1', [apiKey]);
  return res.rows[0] || null;
}

// ---------- Middleware: extract tenant from API key ----------
async function authenticate(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'Missing API key' });
    
    const tenant = await verifyTenant(apiKey);
    if (!tenant) {
      console.warn(`Invalid API key attempt: ${apiKey}`);
      return res.status(403).json({ error: 'Invalid API key' });
    }
    
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

// ---------- Health check (for CI/CD) ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// ---------- 0. Verify credentials ----------
app.get('/api/verify', authenticate, (req, res) => {
  res.json({ valid: true, tenant: req.tenant.name });
});

// ---------- Rate Limiter for ingestion ----------
const ingestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many audit events from this IP, please try again after 15 minutes' }
});

// ---------- 1. Ingest audit event (with hash chain) ----------
app.post('/api/events', ingestLimiter, authenticate, async (req, res, next) => {
  try {
    const { userId, action, resource, metadata = {} } = req.body;
  const tenantId = req.tenant.id;

  // Required fields
  if (!userId || !action || !resource) {
    return res.status(400).json({ error: 'Missing userId, action, or resource' });
  }

  // Get last event's hash for this tenant
  const lastHashRes = await query(
    'SELECT hash FROM audit_events WHERE tenant_id = $1 ORDER BY id DESC LIMIT 1',
    [tenantId]
  );
  const previousHash = lastHashRes.rows[0]?.hash || '0';

  // Create hash of current event + previous hash
  const hashPayload = `${previousHash}|${tenantId}|${userId}|${action}|${resource}|${JSON.stringify(metadata)}|${Date.now()}`;
  const hash = crypto.createHash('sha256').update(hashPayload).digest('hex');

  const result = await query(
    `INSERT INTO audit_events 
     (tenant_id, user_id, action, resource, metadata, previous_hash, hash, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
    [tenantId, userId, action, resource, metadata, previousHash, hash]
  );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// ---------- 2. Search events (with filters) ----------
app.get('/api/events', authenticate, async (req, res) => {
  const tenantId = req.tenant.id;
  const { user, action, startDate, endDate, limit = 100 } = req.query;

  let sql = 'SELECT * FROM audit_events WHERE tenant_id = $1';
  const params = [tenantId];
  let paramIndex = 2;

  if (user) {
    sql += ` AND user_id ILIKE $${paramIndex++}`;
    params.push(`%${user}%`);
  }
  if (action) {
    sql += ` AND action ILIKE $${paramIndex++}`;
    params.push(`%${action}%`);
  }
  if (startDate) {
    sql += ` AND created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  if (endDate) {
    sql += ` AND created_at <= $${paramIndex++}`;
    params.push(endDate);
  }

  sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);

  const result = await query(sql, params);
  res.json(result.rows);
});

// ---------- 3. Request background export ----------
app.post('/api/export', authenticate, async (req, res) => {
  const { filters = {} } = req.body;
  const tenantId = req.tenant.id;

  const job = await exportQueue.add({
    tenantId,
    filters,
    requestedBy: req.tenant.name,
    requestedAt: new Date(),
  });

  res.json({ jobId: job.id, status: 'queued' });
});

// ---------- 4. Check export job status & download ----------
app.get('/api/export/:jobId', authenticate, async (req, res) => {
  const job = await exportQueue.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const state = await job.getState();
  const result = { jobId: job.id, state };
  if (state === 'completed') {
    result.downloadUrl = `/exports/${job.id}.csv`; // In real code, serve from disk/S3
  }
  if (job.failedReason) result.error = job.failedReason;
  res.json(result);
});

// ---------- Error Handling Middleware ----------
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    requestId: req.headers['x-request-id'] || 'N/A'
  });
});

// ---------- Start server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Audit backend running on port ${PORT}`));