-- Migration script to add storeId to existing orders
-- This script handles the data migration safely

-- First, let's add the storeId column as nullable
ALTER TABLE orders ADD COLUMN storeId varchar(255);

-- Update existing orders to use a default store
-- Assuming there's at least one store, we'll use the first one
UPDATE orders 
SET storeId = (SELECT id FROM stores LIMIT 1)
WHERE storeId IS NULL;

-- Now make the column NOT NULL
ALTER TABLE orders ALTER COLUMN storeId SET NOT NULL;

-- Add the foreign key constraint
ALTER TABLE orders 
ADD CONSTRAINT orders_storeId_stores_id_fk 
FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
