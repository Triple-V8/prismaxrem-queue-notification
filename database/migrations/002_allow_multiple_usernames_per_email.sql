-- Migration to allow multiple usernames per email address
-- This removes the unique constraint on email to allow one email to have multiple usernames

-- Remove the unique constraint on email column
ALTER TABLE users DROP CONSTRAINT users_email_key;

-- Add a composite unique constraint to prevent duplicate username-email combinations
-- This ensures a specific username can only be registered once per email
ALTER TABLE users ADD CONSTRAINT users_username_email_unique UNIQUE (username, email);

-- Create an index on email for performance (since we removed the unique constraint which was also an index)
CREATE INDEX idx_users_email_non_unique ON users(email);

-- Update notification tracking: reset notified status for all users
-- This ensures existing users can receive notifications again after the schema change
UPDATE users SET notified = FALSE WHERE notified = TRUE;

-- Insert comment to track this migration
INSERT INTO migration_history (version, description, applied_at) 
VALUES ('002', 'Allow multiple usernames per email address', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Create migration_history table if it doesn't exist (for tracking)
CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    version VARCHAR(10) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);