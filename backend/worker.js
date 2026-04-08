const Queue = require('bull');
const { query } = require('./db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const exportQueue = new Queue('export', process.env.REDIS_URL);
const EXPORT_DIR = path.join(__dirname, 'exports');

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR);

exportQueue.process(async (job) => {
  const { tenantId, filters } = job.data;

  // Build query to fetch events for this tenant with filters
  let sql = 'SELECT * FROM audit_events WHERE tenant_id = $1';
  const params = [tenantId];
  let paramIndex = 2;

  if (filters.user) {
    sql += ` AND user_id = $${paramIndex++}`;
    params.push(filters.user);
  }
  if (filters.action) {
    sql += ` AND action = $${paramIndex++}`;
    params.push(filters.action);
  }
  if (filters.startDate) {
    sql += ` AND created_at >= $${paramIndex++}`;
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    sql += ` AND created_at <= $${paramIndex++}`;
    params.push(filters.endDate);
  }

  sql += ' ORDER BY created_at DESC';

  const result = await query(sql, params);
  const events = result.rows;

  // Create CSV
  const csvRows = [];
  csvRows.push(['id', 'user_id', 'action', 'resource', 'metadata', 'previous_hash', 'hash', 'created_at'].join(','));
  for (const ev of events) {
    csvRows.push([
      ev.id,
      ev.user_id,
      ev.action,
      ev.resource,
      JSON.stringify(ev.metadata).replace(/,/g, ';'), // basic escaping
      ev.previous_hash,
      ev.hash,
      ev.created_at
    ].join(','));
  }

  const filePath = path.join(EXPORT_DIR, `${job.id}.csv`);
  fs.writeFileSync(filePath, csvRows.join('\n'), 'utf8');

  // In production, upload to S3 and return URL
  return { filePath };
});

console.log('Export worker started');