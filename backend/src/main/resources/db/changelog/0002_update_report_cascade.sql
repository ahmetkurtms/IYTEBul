-- Drop existing foreign key constraint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS fk_report_post;

-- Add new foreign key constraint with ON DELETE CASCADE
ALTER TABLE reports ADD CONSTRAINT fk_report_post 
FOREIGN KEY (post_id) REFERENCES item(item_id) ON DELETE CASCADE; 