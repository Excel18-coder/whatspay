import dotenv from "dotenv";
import { connectDB, FiatReserve, ReserveTransaction } from "./data/mongodb.js";

dotenv.config();

async function initializeReserves() {
  try {
    await connectDB();

    console.log("🏦 Initializing Fiat Reserves...\n");

    const currencies = [
      { currency: "KES", initialBalance: 0, lowBalanceThreshold: 10000 },
      { currency: "NGN", initialBalance: 0, lowBalanceThreshold: 50000 },
      { currency: "UGX", initialBalance: 0, lowBalanceThreshold: 1000000 },
      { currency: "TZS", initialBalance: 0, lowBalanceThreshold: 500000 },
    ];

    for (const config of currencies) {
      const existing = await FiatReserve.findOne({ currency: config.currency });

      if (existing) {
        console.log(`✅ ${config.currency} reserve already exists`);
        console.log(`   Balance: ${existing.balance} ${config.currency}`);
        console.log(`   Total Deposited: ${existing.totalDeposited}`);
        console.log(`   Total Converted: ${existing.totalConverted}\n`);
        continue;
      }

      const reserve = await FiatReserve.create(config);

      if (config.initialBalance > 0) {
        await ReserveTransaction.create({
          currency: config.currency,
          type: "adjustment",
          amount: config.initialBalance,
          balanceBefore: 0,
          balanceAfter: config.initialBalance,
          description: "Initial reserve setup",
        });
      }

      console.log(`✅ Created ${config.currency} reserve`);
      console.log(
        `   Initial Balance: ${config.initialBalance} ${config.currency}`
      );
      console.log(`   Low Balance Threshold: ${config.lowBalanceThreshold}\n`);
    }

    console.log("🎉 Reserve initialization complete!\n");

    // Display summary
    const allReserves = await FiatReserve.find();
    console.log("📊 Reserve Summary:");
    console.log("─".repeat(60));
    allReserves.forEach((r) => {
      console.log(`${r.currency}:`);
      console.log(`  Balance: ${r.balance.toLocaleString()} ${r.currency}`);
      console.log(`  Total Deposited: ${r.totalDeposited.toLocaleString()}`);
      console.log(`  Total Converted: ${r.totalConverted.toLocaleString()}`);
      console.log(
        `  Alert Threshold: ${r.lowBalanceThreshold.toLocaleString()}\n`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing reserves:", error);
    process.exit(1);
  }
}

initializeReserves();
