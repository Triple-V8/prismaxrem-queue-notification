-- Migration: Add phone number support for WhatsApp notifications
-- Description: Add phone_number column to users table and update notification_logs

-- Add phone number column to users table
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);

-- Create index for efficient phone number lookups
CREATE INDEX idx_users_phone_number ON users(phone_number);

-- Update notification_logs to track WhatsApp notifications
ALTER TABLE notification_logs ADD COLUMN notification_method VARCHAR(20) DEFAULT 'email';
ALTER TABLE notification_logs ADD COLUMN phone_number VARCHAR(20);

-- Add index for notification method filtering
CREATE INDEX idx_notification_logs_method ON notification_logs(notification_method);

-- Update existing notification logs to have 'email' as method
UPDATE notification_logs SET notification_method = 'email' WHERE notification_method IS NULL;