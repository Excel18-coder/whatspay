import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./data/mongodb.js";
import bankAccountRoutes from "./routes/bankAccounts.js";
import cardRoutes from "./routes/cards.js";
import claimRoutes from "./routes/claims.js";
import contactRoutes from "./routes/contacts.js";
import exchangeRoutes from "./routes/exchange.js";
import paymentRoutes from "./routes/payments.js";
import transactionRoutes from "./routes/transactions.js";
import userRoutes from "./routes/users.js";
import walletRoutes from "./routes/wallets.js";
import { startRateRefreshJob } from "./services/exchangeRates.js";

dotenv.config();

// Connect to MongoDB
await connectDB();

// Start real-time exchange rate refresh job (updates every 60 minutes)
startRateRefreshJob(60);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
  })
);
// Increase payload size limit for profile pictures (10MB)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "WhatsPay API",
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/exchange", exchangeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/bank-accounts", bankAccountRoutes);
app.use("/api/cards", cardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WhatsPay API Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
