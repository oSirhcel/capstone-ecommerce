-- Fix enum values in existing data
-- Update any lowercase 'completed' to uppercase 'Completed'

UPDATE orders 
SET status = 'Completed' 
WHERE status = 'completed';

-- Update any other potential lowercase values
UPDATE orders 
SET status = 'Processing' 
WHERE status = 'processing';

UPDATE orders 
SET status = 'Shipped' 
WHERE status = 'shipped';

UPDATE orders 
SET status = 'Cancelled' 
WHERE status = 'cancelled';

UPDATE orders 
SET status = 'Refunded' 
WHERE status = 'refunded';

UPDATE orders 
SET status = 'On-hold' 
WHERE status = 'on-hold';

UPDATE orders 
SET status = 'Failed' 
WHERE status = 'failed';

UPDATE orders 
SET status = 'Pending' 
WHERE status = 'pending';
