-- Assumes users are added via /register endpoint first
-- Add sample complaints (user_id 1 = student1)
INSERT INTO complaints (user_id, description, status) VALUES
(1, 'Leaky faucet in room 101', 'pending'),
(1, 'No hot water in bathroom', 'resolved');

-- Add sample leaves (user_id 1 = student1)
INSERT INTO leaves (user_id, reason, start_date, end_date, status) VALUES
(1, 'Family event', '2025-04-01', '2025-04-03', 'pending'),
(1, 'Medical appointment', '2025-04-05', '2025-04-05', 'approved');