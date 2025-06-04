--liquibase formatted sql

--changeset system:8
CREATE TABLE user_reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    reporter_id BIGINT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN') NOT NULL DEFAULT 'PENDING',
    reviewed_at TIMESTAMP NULL,
    reviewed_by BIGINT NULL,

    FOREIGN KEY (user_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(users_id) ON DELETE SET NULL
);

--changeset system:8b
ALTER TABLE user_reports ADD COLUMN reported_message_ids TEXT; 