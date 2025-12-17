-- Seed data for USDT application
-- This creates a default user, wallet, and sample data for testing

-- Insert default user with specific UUID for testing
INSERT INTO users (id, name, phone, avatar, kyc_status) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'John Doe', '+1234567890', 'JD', 'verified')
ON CONFLICT (phone) DO NOTHING;

-- Insert wallet for default user
INSERT INTO wallets (user_id, balance, currency) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 1000.00, 'USDC')
ON CONFLICT DO NOTHING;

-- Insert sample contacts
INSERT INTO contacts (user_id, name, phone, avatar) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'Alice Smith', '+1234567891', 'AS'),
('00000000-0000-0000-0000-000000000001'::uuid, 'Bob Johnson', '+1234567892', 'BJ'),
('00000000-0000-0000-0000-000000000001'::uuid, 'Charlie Brown', '+1234567893', 'CB'),
('00000000-0000-0000-0000-000000000001'::uuid, 'Diana Prince', '+1234567894', 'DP')
ON CONFLICT DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (user_id, type, amount, currency, status, metadata) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'deposit', 500.00, 'USDC', 'completed', '{"method": "bank_transfer"}'),
('00000000-0000-0000-0000-000000000001'::uuid, 'send', 50.00, 'USDC', 'completed', '{"recipient": "Alice Smith", "recipientId": "user-2"}'),
('00000000-0000-0000-0000-000000000001'::uuid, 'receive', 25.00, 'USDC', 'completed', '{"sender": "Bob Johnson"}'),
('00000000-0000-0000-0000-000000000001'::uuid, 'deposit', 500.00, 'USDC', 'completed', '{"method": "card"}'),
('00000000-0000-0000-0000-000000000001'::uuid, 'send', 75.00, 'USDC', 'completed', '{"recipient": "Charlie Brown"}'),
('00000000-0000-0000-0000-000000000001'::uuid, 'receive', 100.00, 'USDC', 'completed', '{"sender": "Diana Prince"}')
ON CONFLICT DO NOTHING;

-- Additional users for testing
INSERT INTO users (id, name, phone, avatar) VALUES
('00000000-0000-0000-0000-000000000002'::uuid, 'Alice Smith', '+1234567891', 'AS'),
('00000000-0000-0000-0000-000000000003'::uuid, 'Bob Johnson', '+1234567892', 'BJ')
ON CONFLICT (phone) DO NOTHING;

-- Wallets for additional users
INSERT INTO wallets (user_id, balance, currency) VALUES
('00000000-0000-0000-0000-000000000002'::uuid, 50.00, 'USDC'),
('00000000-0000-0000-0000-000000000003'::uuid, 0.00, 'USDC')
ON CONFLICT DO NOTHING;

-- Sample claim (pending)
INSERT INTO claims (sender_id, sender_name, amount, currency, status, expires_at) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'John Doe', 20.00, 'USDC', 'pending', NOW() + INTERVAL '24 hours')
ON CONFLICT DO NOTHING;

-- Note: Exchange rates are already seeded in migrations.sql
