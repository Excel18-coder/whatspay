import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  connectDB,
  Contact,
  ExchangeRate,
  Transaction,
  User,
  Wallet,
} from "./data/mongodb.js";

dotenv.config();

async function seed() {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Transaction.deleteMany({});
    await Contact.deleteMany({});
    await ExchangeRate.deleteMany({});

    console.log("🗑️  Cleared existing data");

    // Create test user
    const user = await User.create({
      name: "Alex Kamau",
      phone: "+254712345678",
      avatar: "AK",
      kycStatus: "verified",
    });

    console.log("✅ Created user:", user.name);

    // Create wallet
    const wallet = await Wallet.create({
      userId: user._id,
      balance: 1250.5,
      currency: "USDC",
    });

    console.log("✅ Created wallet with balance:", wallet.balance);

    // Create contacts
    const contacts = await Contact.create([
      {
        userId: user._id,
        name: "Sarah Mwangi",
        phone: "+254722111222",
        avatar: "SM",
      },
      {
        userId: user._id,
        name: "John Ochieng",
        phone: "+254733444555",
        avatar: "JO",
      },
      {
        userId: user._id,
        name: "Grace Njeri",
        phone: "+254744666777",
        avatar: "GN",
      },
    ]);

    console.log("✅ Created", contacts.length, "contacts");

    // Create transactions
    const transactions = await Transaction.create([
      {
        userId: user._id,
        type: "deposit",
        amount: 500,
        currency: "USDC",
        status: "completed",
        description: "M-Pesa deposit",
        paymentMethod: "mpesa",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        userId: user._id,
        type: "send",
        amount: 125.5,
        currency: "USDC",
        status: "completed",
        recipientPhone: "+254722111222",
        description: "Payment to Sarah Mwangi",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        userId: user._id,
        type: "receive",
        amount: 200,
        currency: "USDC",
        status: "completed",
        senderPhone: "+254733444555",
        description: "Payment from John Ochieng",
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
      {
        userId: user._id,
        type: "deposit",
        amount: 750,
        currency: "USDC",
        status: "completed",
        description: "Bank transfer",
        paymentMethod: "bank",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
    ]);

    console.log("✅ Created", transactions.length, "transactions");

    // Create exchange rates
    const rates = await ExchangeRate.create([
      { currency: "KES", rate: 129.5 },
      { currency: "USD", rate: 1.0 },
      { currency: "EUR", rate: 0.92 },
      { currency: "GBP", rate: 0.79 },
    ]);

    console.log("✅ Created", rates.length, "exchange rates");

    console.log("\n🎉 Database seeded successfully!");
    console.log("\nTest Account:");
    console.log("- Name:", user.name);
    console.log("- Phone:", user.phone);
    console.log("- Wallet Balance:", wallet.balance, wallet.currency);

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

seed();
