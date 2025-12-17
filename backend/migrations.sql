-- migrations.sql: PostgreSQL schema for USDT backend

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    avatar VARCHAR(10),
    kyc_status VARCHAR(20) DEFAULT 'unverified',
    created_at TIMESTAMP DEFAULT NOW(),
    daily_limit NUMERIC DEFAULT 500,
    monthly_limit NUMERIC DEFAULT 5000
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USDC',
    local_currency VARCHAR(10) DEFAULT 'KES'
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    avatar VARCHAR(10)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    amount NUMERIC NOT NULL,
    currency VARCHAR(10) NOT NULL,
    recipient VARCHAR(100),
    sender VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    timestamp TIMESTAMP DEFAULT NOW(),
    fee NUMERIC,
    metadata JSONB
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_name VARCHAR(100),
    amount NUMERIC NOT NULL,
    currency VARCHAR(10) NOT NULL,
    recipient_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    claimed_by UUID REFERENCES users(id),
    claimed_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- Exchange rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
    currency VARCHAR(10) PRIMARY KEY,
    rate NUMERIC NOT NULL
);

-- Insert default exchange rates
INSERT INTO exchange_rates (currency, rate) VALUES
    ('KES', 129.0),
    ('NGN', 1550.0),
    ('UGX', 3750.0),
    ('TZS', 2500.0),
    ('USD', 1.0),
    ('USDC', 1.0)
ON CONFLICT (currency) DO NOTHING;
