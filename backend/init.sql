CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_events (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}',
    previous_hash TEXT NOT NULL,
    hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster searching
CREATE INDEX idx_audit_events_tenant_id ON audit_events(tenant_id);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at);
CREATE INDEX idx_audit_events_user_id ON audit_events(user_id);

-- Seed a default tenant
INSERT INTO tenants (name, api_key) VALUES ('Default Tenant', 'test-api-key-123') ON CONFLICT DO NOTHING;

-- Seed some sample events
INSERT INTO audit_events (tenant_id, user_id, action, resource, metadata, previous_hash, hash, created_at)
VALUES 
(1, 'super_admin', 'login', 'audit_portal', '{"ip": "10.0.0.5", "geo": "US"}', '0', '716a5d4430e7939108a74e503a6776103b41d06e', NOW() - INTERVAL '24 hours'),
(1, 'dev_mike', 'view_config', 'secrets/db_config', '{"access_level": "read"}', '716a5d4430e7939108a74e503a6776103b41d06e', '828b6e5541f8040219b85f614b7887214c52e17f', NOW() - INTERVAL '23 hours'),
(1, 'system_bot', 'rotate_keys', 'kms/service_a', '{"status": "success"}', '828b6e5541f8040219b85f614b7887214c52e17f', '939c7f6652a9151320c96a725c8998325d63f28g', NOW() - INTERVAL '22 hours'),
(1, 'user_sarah', 'login', 'web_app', '{"browser": "firefox"}', '939c7f6652a9151320c96a725c8998325d63f28g', 'a4ad807763b0262431da7b836d90a9436e74039h', NOW() - INTERVAL '21 hours'),
(1, 'user_sarah', 'upload_file', 'storage/bucket_1/photo.jpg', '{"size": "2MB"}', 'a4ad807763b0262431da7b836d90a9436e74039h', 'b5be918874c1373542eb8c947ea1ba547f85140i', NOW() - INTERVAL '20 hours'),
(1, 'admin_pete', 'login', 'audit_portal', '{"ip": "192.168.1.100"}', 'b5be918874c1373542eb8c947ea1ba547f85140i', 'c6cf029985d2484653fc9da58fb2cb658096251j', NOW() - INTERVAL '19 hours'),
(1, 'admin_pete', 'export_data', 'database/audit_events', '{"format": "csv"}', 'c6cf029985d2484653fc9da58fb2cb658096251j', 'd7dg130096e3595764fdade690c3dc7691a7362k', NOW() - INTERVAL '18 hours'),
(1, 'user_john', 'login', 'web_app', '{"browser": "chrome"}', 'd7dg130096e3595764fdade690c3dc7691a7362k', 'e8eh241107f4606875gebe9701d4ed87a2b8473l', NOW() - INTERVAL '17 hours'),
(1, 'user_john', 'create_user', 'iam/users/intern_1', '{"role": "viewer"}', 'e8eh241107f4606875gebe9701d4ed87a2b8473l', 'f9fi352218g5717986hfcf0812e5fe98b3c9584m', NOW() - INTERVAL '16 hours'),
(1, 'system_bot', 'security_scan', 'infrastructure/vpc_1', '{"threats_found": 0}', 'f9fi352218g5717986hfcf0812e5fe98b3c9584m', 'g0gj463329h6828097igdg1923f6gf09c4d0695n', NOW() - INTERVAL '15 hours'),
(1, 'dev_mike', 'delete_log', 'logs/debug_prev.txt', '{"reason": "cleanup"}', 'g0gj463329h6828097igdg1923f6gf09c4d0695n', 'h1hk574430i7939108jhehe2034g7gh10d5e176o', NOW() - INTERVAL '14 hours'),
(1, 'admin_pete', 'modify_policy', 'iam/policies/default', '{"changes": "restrict_s3"}', 'h1hk574430i7939108jhehe2034g7gh10d5e176o', 'i2il685541j8040219kifi3145h8hi21e6f287p', NOW() - INTERVAL '13 hours'),
(1, 'user_sarah', 'access_denied', 'vault/admin_secret', '{"ip": "10.0.0.12"}', 'i2il685541j8040219kifi3145h8hi21e6f287p', 'j3jm796652k9151320ljgj4256i9ij32f7g398q', NOW() - INTERVAL '12 hours'),
(1, 'user_john', 'update_resource', 'cms/page_home', '{"version": "2.1"}', 'j3jm796652k9151320ljgj4256i9ij32f7g398q', 'k4kn807763l0262431mkhk5367j0jk43g8h409r', NOW() - INTERVAL '11 hours'),
(1, 'system_monitoring', 'health_check', 'api/gateway', '{"latency": "45ms"}', 'k4kn807763l0262431mkhk5367j0jk43g8h409r', 'l5lo918874m1373542nlil6478k1kl54h9i510s', NOW() - INTERVAL '10 hours'),
(1, 'dev_mike', 'merge_code', 'repo/core_api', '{"pr_id": 442}', 'l5lo918874m1373542nlil6478k1kl54h9i510s', 'm6mp029985n2484653omjm7589l2lm65i0j621t', NOW() - INTERVAL '9 hours'),
(1, 'admin_pete', 'login', 'audit_portal', '{"ip": "10.0.0.5"}', 'm6mp029985n2484653omjm7589l2lm65i0j621t', 'n7nq130096o3595764pnkn8690m3mn76j1k732u', NOW() - INTERVAL '8 hours'),
(1, 'user_sarah', 'logout', 'web_app', '{}', 'n7nq130096o3595764pnkn8690m3mn76j1k732u', 'o8or241107p4606875qolo9701n4no87k2l843v', NOW() - INTERVAL '7 hours'),
(1, 'user_john', 'share_document', 'docs/project_plan', '{"with": "guest_3"}', 'o8or241107p4606875qolo9701n4no87k2l843v', 'p9ps352218q5717986rpmp0812o5op98l3m954w', NOW() - INTERVAL '6 hours'),
(1, 'system_bot', 'backup_db', 's3://audit-backups', '{"size": "14GB"}', 'p9ps352218q5717986rpmp0812o5op98l3m954w', 'q0qt463329r6828097sqnq1923p6pq09c4n065x', NOW() - INTERVAL '5 hours'),
(1, 'dev_mike', 'restart_service', 'api_gateway', '{"reason": "memory_leak"}', 'q0qt463329r6828097sqnq1923p6pq09c4n065x', 'r1ru574430s7939108tror2034q7qr10d5o176y', NOW() - INTERVAL '4 hours'),
(1, 'user_john', 'login', 'web_app', '{"browser": "safari"}', 'r1ru574430s7939108tror2034q7qr10d5o176y', 's2sv685541t8040219usps3145r8rs21e6p287z', NOW() - INTERVAL '3 hours'),
(1, 'admin_pete', 'view_audit', 'reports/weekly_summary', '{}', 's2sv685541t8040219usps3145r8rs21e6p287z', 't3tw796652u9151320vtqt4256s9st32f7q39801', NOW() - INTERVAL '2 hours'),
(1, 'user_sarah', 'login', 'web_app', '{"ip": "172.16.0.4"}', 't3tw796652u9151320vtqt4256s9st32f7q39801', 'u4ux807763v0262431wuru5367t0tu43g8r40912', NOW() - INTERVAL '1 hour'),
(1, 'user_sarah', 'download', 'reports/final_q4.pdf', '{"format": "pdf"}', 'u4ux807763v0262431wuru5367t0tu43g8r40912', 'v5vy918874w1373542xvsv6478u1uv54h9s51023', NOW() - INTERVAL '15 minutes');
