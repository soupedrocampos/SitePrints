-- CREATE INDEX CONCURRENTLY cannot run inside a transaction
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gmaps_jobs_status_priority_created 
ON gmaps_jobs(status, priority ASC, created_at ASC);
