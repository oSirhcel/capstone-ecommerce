-- Check what order status values exist in the database
SELECT DISTINCT status, COUNT(*) as count 
FROM orders 
GROUP BY status 
ORDER BY status;
