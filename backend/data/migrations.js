import { query } from "./db.js";

export async function createTables() {
  try {
    console.log("🔧 Creating database tables...");

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) UNIQUE NOT NULL,
        avatar VARCHAR(10),
        kyc_status VARCHAR(50) DEFAULT 'unverified',
        daily_limit DECIMAL(10, 2) DEFAULT 500,
        monthly_limit DECIMAL(10, 2) DEFAULT 5000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Wallets table
    await query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(10, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USDC',
        local_currency VARCHAR(10) DEFAULT 'KES',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    // Transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USDC',
        recipient VARCHAR(255),
        sender VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        fee DECIMAL(10, 2) DEFAULT 0,
        metadata JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Claims table
    await query(`
      CREATE TABLE IF NOT EXISTS claims (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
        sender_name VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USDC',
        recipient_phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        claimed_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        claimed_at TIMESTAMP,
        cancelled_at TIMESTAMP
      )
    `);

    // Contacts table
    await query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        avatar VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, phone)
      )
    `);

    // Exchange rates table
    await query(`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id SERIAL PRIMARY KEY,
        currency VARCHAR(10) UNIQUE NOT NULL,
        rate DECIMAL(10, 4) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await query(
      `CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_claims_sender_id ON claims(sender_id)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id)`
    );
    await query(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`);

    console.log("✅ Database tables created successfully");

    // Initialize exchange rates
    await initializeExchangeRates();

    return true;
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
}

async function initializeExchangeRates() {
  const rates = [
    { currency: "KES", rate: 129.0 },
    { currency: "NGN", rate: 1550.0 },
    { currency: "UGX", rate: 3750.0 },
    { currency: "TZS", rate: 2500.0 },
    { currency: "USD", rate: 1.0 },
    { currency: "USDC", rate: 1.0 },
  ];

  for (const { currency, rate } of rates) {
    await query(
      `
      INSERT INTO exchange_rates (currency, rate)
      VALUES ($1, $2)
      ON CONFLICT (currency) DO UPDATE SET rate = $2, updated_at = CURRENT_TIMESTAMP
    `,
      [currency, rate]
    );
  }

  console.log("✅ Exchange rates initialized");
}

export async function dropTables() {
  try {
    console.log("🗑️  Dropping all tables...");

    await query("DROP TABLE IF EXISTS contacts CASCADE");
    await query("DROP TABLE IF EXISTS exchange_rates CASCADE");
    await query("DROP TABLE IF EXISTS claims CASCADE");
    await query("DROP TABLE IF EXISTS transactions CASCADE");
    await query("DROP TABLE IF EXISTS wallets CASCADE");
    await query("DROP TABLE IF EXISTS users CASCADE");

    console.log("✅ All tables dropped");
    return true;
  } catch (error) {
    console.error("❌ Error dropping tables:", error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTables()
    .then(() => {
      console.log("✅ Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}
