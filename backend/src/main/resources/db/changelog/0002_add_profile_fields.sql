-- Add profile fields to users table
ALTER TABLE users 
ADD COLUMN phone_number VARCHAR(20),
ADD COLUMN bio TEXT,
ADD COLUMN profile_photo_url TEXT,
ADD COLUMN student_id VARCHAR(20),
ADD COLUMN department VARCHAR(255),
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_code VARCHAR(255);

-- Set default department for existing users
UPDATE users SET department = 'Bilgisayar Mühendisliği' WHERE department IS NULL; 