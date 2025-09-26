-- Users table to store user information and notification preferences
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    username_pattern VARCHAR(50) NOT NULL, -- The abcd..ijk format
    email VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Queue status table to track current queue state
CREATE TABLE queue_status (
    id SERIAL PRIMARY KEY,
    current_user_pattern VARCHAR(50),
    raw_content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification logs table to track sent notifications
CREATE TABLE notification_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) DEFAULT 'queue_notification',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_status VARCHAR(20) DEFAULT 'pending' -- pending, sent, failed
);

-- Create indexes for better performance
CREATE INDEX idx_users_username_pattern ON users(username_pattern);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_queue_status_timestamp ON queue_status(timestamp);
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();