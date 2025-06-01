--liquibase formatted sql

--changeset system:7
CREATE TABLE reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    reporter_id BIGINT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN') NOT NULL DEFAULT 'PENDING',
    reviewed_at TIMESTAMP NULL,
    reviewed_by BIGINT NULL,
    
    FOREIGN KEY (post_id) REFERENCES items(item_id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(users_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(users_id) ON DELETE SET NULL
); 