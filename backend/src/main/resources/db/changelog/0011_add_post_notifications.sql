-- Add post notifications preference to users table
ALTER TABLE users 
ADD COLUMN post_notifications BOOLEAN DEFAULT TRUE;

-- Set default value for existing users
UPDATE users SET post_notifications = TRUE WHERE post_notifications IS NULL; 