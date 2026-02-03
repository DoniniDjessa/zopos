-- Add user_id column to zopos_sales table to track who made each sale
ALTER TABLE zopos_sales 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add deleted column for soft delete functionality
ALTER TABLE zopos_sales 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_zopos_sales_user_id ON zopos_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_zopos_sales_deleted ON zopos_sales(deleted);

-- Optionally add comments
COMMENT ON COLUMN zopos_sales.user_id IS 'ID of the user who created this sale';
COMMENT ON COLUMN zopos_sales.deleted IS 'Soft delete flag - sale is hidden but still in statistics';
