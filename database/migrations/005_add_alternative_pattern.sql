-- Migration: Add alternative username pattern column
-- Description: Add alternative_pattern column to support variable-length pattern matching (B3by..N3vz vs B3by..3vz)

-- Add alternative_pattern column to users table
ALTER TABLE users ADD COLUMN alternative_pattern VARCHAR(50);

-- Create index for efficient alternative pattern lookups
CREATE INDEX idx_users_alternative_pattern ON users(alternative_pattern);

-- Add comment for documentation
COMMENT ON COLUMN users.alternative_pattern IS 'Alternative username pattern with last 4 characters instead of 3 (e.g., B3by..N3vz vs B3by..3vz)';

-- Update existing users with alternative patterns (generate from existing usernames)
-- This will be populated by a separate UPDATE command provided below