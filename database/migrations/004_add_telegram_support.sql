-- Migration: Add Telegram support and remove WhatsApp/phone number
-- Description: Replace WhatsApp functionality with Telegram bot integration

-- Remove WhatsApp/phone number columns and indexes
DROP INDEX IF EXISTS idx_users_phone_number;
DROP INDEX IF EXISTS idx_notification_logs_method;

ALTER TABLE users DROP COLUMN IF EXISTS phone_number;
ALTER TABLE notification_logs 
  DROP COLUMN IF EXISTS notification_method,
  DROP COLUMN IF EXISTS phone_number;

-- Add Telegram columns to users table
ALTER TABLE users 
  ADD COLUMN telegram_username VARCHAR(255),
  ADD COLUMN telegram_chat_id BIGINT;

-- Create indexes for efficient Telegram lookups
CREATE INDEX idx_users_telegram_username ON users(telegram_username);
CREATE INDEX idx_users_telegram_chat_id ON users(telegram_chat_id);

-- Add Telegram notification support to notification_logs
ALTER TABLE notification_logs 
  ADD COLUMN notification_method VARCHAR(20) DEFAULT 'email',
  ADD COLUMN telegram_username VARCHAR(255);

-- Create index for notification method filtering
CREATE INDEX idx_notification_logs_method ON notification_logs(notification_method);

-- Update existing notification logs to have 'email' as method
UPDATE notification_logs SET notification_method = 'email' WHERE notification_method IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.telegram_username IS 'Telegram username without @ symbol';
COMMENT ON COLUMN users.telegram_chat_id IS 'Telegram chat ID for bot messaging';
COMMENT ON COLUMN notification_logs.telegram_username IS 'Telegram username for notification tracking';