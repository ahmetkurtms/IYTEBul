-- Add email notifications preference to users table
ALTER TABLE users 
ADD COLUMN email_notifications BOOLEAN DEFAULT TRUE;

-- Set default value for existing users
UPDATE users SET email_notifications = TRUE WHERE email_notifications IS NULL; 