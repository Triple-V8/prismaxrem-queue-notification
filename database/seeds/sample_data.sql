-- Sample users with their username patterns
INSERT INTO users (username, username_pattern, email) VALUES
('abcdefghijk', 'abcd..ijk', 'alice@example.com'),
('johndoesmith', 'john..ith', 'john@example.com'),
('maryjohnson', 'mary..son', 'mary@example.com'),
('testuser123', 'test..123', 'testuser@example.com');

-- Sample queue status (this will be updated by the browser extension)
INSERT INTO queue_status (current_user_pattern, raw_content) VALUES
('abcd..ijk', 'Current user: abcd..ijk');

-- Sample notification logs
INSERT INTO notification_logs (user_id, notification_type, email_status) VALUES
(1, 'queue_notification', 'sent');