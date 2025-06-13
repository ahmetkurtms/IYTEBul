--liquibase formatted sql

--changeset system:9
-- Add columns to track different types of message deletions
ALTER TABLE messages 
ADD COLUMN deleted_for_sender BOOLEAN DEFAULT FALSE,
ADD COLUMN deleted_for_receiver BOOLEAN DEFAULT FALSE,
ADD COLUMN is_deleted_completely BOOLEAN DEFAULT FALSE,
ADD COLUMN deleted_at TIMESTAMP NULL;

-- Create index for better performance
CREATE INDEX idx_messages_deleted_for_sender ON messages(deleted_for_sender);
CREATE INDEX idx_messages_deleted_for_receiver ON messages(deleted_for_receiver);
CREATE INDEX idx_messages_deleted_completely ON messages(is_deleted_completely); 