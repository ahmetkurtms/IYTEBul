-- Add ban expiry and reason fields to users table
ALTER TABLE users 
ADD COLUMN ban_expires_at TIMESTAMP,
ADD COLUMN ban_reason TEXT; 