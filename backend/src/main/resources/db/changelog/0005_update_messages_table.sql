-- Update message_text column to TEXT type
ALTER TABLE messages ALTER COLUMN message_text TYPE TEXT;

-- Create table for message images
CREATE TABLE message_images (
    id SERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES messages(message_id) ON DELETE CASCADE,
    image_base64 TEXT NOT NULL
); 