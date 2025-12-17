import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/whatspay";

// Connect to MongoDB
export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: String,
  dateOfBirth: String,
  address: String,
  city: String,
  country: String,
  avatar: String,
  profilePicture: String, // URL or base64 encoded image
  kycStatus: { type: String, default: "unverified" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Wallet Schema
const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: "USDC" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true }, // send, receive, deposit, withdraw
  amount: { type: Number, required: true },
  currency: { type: String, default: "USDC" },
  status: { type: String, default: "completed" }, // pending, completed, failed
  recipientPhone: String,
  senderPhone: String,
  description: String,
  paymentMethod: String,
  paymentReference: String,
  createdAt: { type: Date, default: Date.now },
});

// Contact Schema
const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  avatar: String,
  createdAt: { type: Date, default: Date.now },
});

// Claim Schema
const claimSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USDC" },
  recipientPhone: String,
  claimCode: { type: String, required: true, unique: true },
  status: { type: String, default: "pending" }, // pending, claimed, expired
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  claimedAt: Date,
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now },
});

// Exchange Rate Schema
const exchangeRateSchema = new mongoose.Schema({
  currency: { type: String, required: true, unique: true },
  rate: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});

// Bank Account Schema
const bankAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  bankName: { type: String, required: true },
  bankCode: String,
  branchName: String,
  branchCode: String,
  swiftCode: String,
  currency: { type: String, default: "KES" },
  isPrimary: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Card Schema
const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cardholderName: { type: String, required: true },
  cardNumber: { type: String, required: true }, // Store last 4 digits only
  cardType: {
    type: String,
    enum: ["visa", "mastercard", "amex", "discover"],
    required: true,
  },
  expiryMonth: { type: String, required: true },
  expiryYear: { type: String, required: true },
  cvv: { type: String }, // Never store in production, only for demo
  billingAddress: String,
  billingCity: String,
  billingCountry: { type: String, default: "Kenya" },
  billingPostalCode: String,
  isPrimary: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  token: String, // For payment gateway tokenization
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Fiat Reserve Schema - Tracks fiat currency in M-Pesa till
const fiatReserveSchema = new mongoose.Schema({
  currency: { type: String, required: true, unique: true }, // KES, NGN, etc.
  balance: { type: Number, default: 0 }, // Total fiat in reserve (M-Pesa till)
  totalDeposited: { type: Number, default: 0 }, // Lifetime deposits received
  totalConverted: { type: Number, default: 0 }, // Lifetime fiat converted to crypto
  totalWithdrawn: { type: Number, default: 0 }, // Lifetime withdrawals sent out
  lastActivity: { type: Date, default: Date.now },
  lowBalanceThreshold: { type: Number, default: 10000 }, // Alert threshold
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Reserve Transaction Log - Audit trail for reserve movements
const reserveTransactionSchema = new mongoose.Schema({
  currency: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ["deposit", "conversion", "withdrawal", "adjustment"],
  }, // deposit = fiat coming in, conversion = fiat → crypto, withdrawal = fiat going out
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  relatedTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

// Export models
export const User = mongoose.model("User", userSchema);
export const Wallet = mongoose.model("Wallet", walletSchema);
export const Transaction = mongoose.model("Transaction", transactionSchema);
export const Contact = mongoose.model("Contact", contactSchema);
export const Claim = mongoose.model("Claim", claimSchema);
export const ExchangeRate = mongoose.model("ExchangeRate", exchangeRateSchema);
export const BankAccount = mongoose.model("BankAccount", bankAccountSchema);
export const Card = mongoose.model("Card", cardSchema);
export const FiatReserve = mongoose.model("FiatReserve", fiatReserveSchema);
export const ReserveTransaction = mongoose.model(
  "ReserveTransaction",
  reserveTransactionSchema
);
