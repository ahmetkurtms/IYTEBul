--liquibase formatted sql

--changeset system:10
-- Drop the deleted_messages table since we now use flags in messages table
DROP TABLE IF EXISTS deleted_messages; 