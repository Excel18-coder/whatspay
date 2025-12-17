import express from "express";
import { Transaction, Wallet } from "../data/mongodb.js";
import { validateCallback } from "../services/lipia.js";
import {
  convertFiatToStablecoin,
  getConversionRate,
  getSupportedCurrencies,
} from "../services/yellowcard.js";

const router = express.Router();

// Lipia Online callback webhook
router.post("/lipia-callback", async (req, res) => {
  try {
    console.log("Received Lipia callback:", JSON.stringify(req.body, null, 2));

    // Validate callback payload
    const validated = validateCallback(req.body);

    if (!validated.isValid) {
      console.error("Invalid callback payload:", validated.error);
      return res.status(400).send("ok"); // Still respond with "ok" to prevent retries
    }

    const {
      isSuccess,
      amount,
      externalReference,
      mpesaReceiptNumber,
      phone,
      resultCode,
      resultDescription,
      metadata,
    } = validated;

    // Find the pending transaction by external reference
    const transaction = await Transaction.findOne({
      _id: externalReference,
      status: "pending",
    });

    if (!transaction) {
      console.warn(
        "Transaction not found or already processed:",
        externalReference
      );
      return res.status(200).send("ok");
    }

    const userId = transaction.userId;

    if (isSuccess && resultCode === 0) {
      // Payment successful - update wallet and transaction
      console.log(`Payment successful for transaction ${externalReference}:`, {
        amount,
        mpesaReceiptNumber,
        phone,
      });

      // Update wallet balance
      const wallet = await Wallet.findOne({ userId });
      if (wallet) {
        wallet.balance += transaction.amount;
        wallet.updatedAt = new Date();
        await wallet.save();
      }

      // Update transaction status
      transaction.status = "completed";
      transaction.paymentReference = mpesaReceiptNumber;
      transaction.description += ` - M-Pesa Receipt: ${mpesaReceiptNumber}`;
      await transaction.save();

      console.log(
        `Wallet updated for user ${userId}, amount: ${transaction.amount}`
      );
    } else {
      // Payment failed - update transaction status
      console.log(`Payment failed for transaction ${externalReference}:`, {
        resultCode,
        resultDescription,
      });

      transaction.status = "failed";
      transaction.description += ` - Failed: ${resultDescription}`;
      await transaction.save();
    }

    // Respond with "ok" as required by Lipia
    res.status(200).send("ok");
  } catch (error) {
    console.error("Callback handler error:", error);
    res.status(200).send("ok"); // Always respond with ok
  }
});

// Withdraw to M-Pesa endpoint
router.post("/withdraw", async (req, res) => {
  try {
    const { userId, phone, amount, currency = "KES" } = req.body;

    if (!userId || !phone || !amount) {
      return res
        .status(400)
        .json({ error: "userId, phone, and amount are required" });
    }

    // Validate phone number format
    const phoneRegex = /^(07|01)\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Check sufficient balance
    if (amount > wallet.balance) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Create withdrawal transaction
    const transaction = await Transaction.create({
      userId,
      type: "withdraw",
      amount,
      currency,
      status: "completed", // M-Pesa withdrawals are instant
      paymentMethod: "mpesa",
      description: `Withdrawal to M-Pesa ${phone}`,
      recipient: phone,
      createdAt: new Date(),
    });

    // Update wallet balance
    wallet.balance -= amount;
    wallet.updatedAt = new Date();
    await wallet.save();

    console.log(
      `M-Pesa withdrawal: User ${userId}, Amount: ${amount}, Phone: ${phone}`
    );

    res.json({
      success: true,
      transactionId: transaction._id.toString(),
      message: "Withdrawal successful",
      amount,
      currency,
      phone,
    });
  } catch (error) {
    console.error("M-Pesa withdrawal error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Deposit from M-Pesa endpoint
router.post("/deposit", async (req, res) => {
  try {
    const { userId, phone, amount } = req.body;

    if (!userId || !phone || !amount) {
      return res
        .status(400)
        .json({ error: "userId, phone, and amount are required" });
    }

    // Validate phone number format
    const phoneRegex = /^(07|01)\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Create deposit transaction
    const transaction = await Transaction.create({
      userId,
      type: "deposit",
      amount,
      currency: "KES",
      status: "pending", // Will be updated by callback
      paymentMethod: "mpesa",
      description: `M-Pesa deposit from ${phone}`,
      sender: phone,
      createdAt: new Date(),
    });

    console.log(
      `M-Pesa deposit initiated: User ${userId}, Amount: ${amount}, Phone: ${phone}`
    );

    res.json({
      success: true,
      transactionId: transaction._id.toString(),
      message: "Deposit initiated. Please complete payment on your phone.",
      amount,
      phone,
    });
  } catch (error) {
    console.error("M-Pesa deposit error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Check payment status endpoint
router.get("/status/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({
      transactionId: transaction._id.toString(),
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      type: transaction.type,
      paymentMethod: transaction.paymentMethod,
      paymentReference: transaction.paymentReference,
      description: transaction.description,
      createdAt: transaction.createdAt,
    });
  } catch (error) {
    console.error("Error fetching transaction status:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Yellow Card conversion rate (fiat to stablecoin)
router.get("/yellowcard/rate", async (req, res) => {
  try {
    const { fiatCurrency, stablecoin, type = "buy" } = req.query;

    if (!fiatCurrency || !stablecoin) {
      return res.status(400).json({
        error: "fiatCurrency and stablecoin are required",
      });
    }

    const rateInfo = await getConversionRate(fiatCurrency, stablecoin, type);

    res.json(rateInfo);
  } catch (error) {
    console.error("Error fetching Yellow Card rate:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get supported currencies for Yellow Card
router.get("/yellowcard/currencies", (req, res) => {
  try {
    const supported = getSupportedCurrencies();
    res.json(supported);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Convert fiat deposit to stablecoin using Yellow Card
router.post("/deposit/fiat-to-stablecoin", async (req, res) => {
  try {
    const {
      userId,
      fiatAmount,
      fiatCurrency = "KES",
      stablecoin = "USDC",
      phone,
      paymentMethod = "mpesa",
    } = req.body;

    if (!userId || !fiatAmount || !phone) {
      return res.status(400).json({
        error: "userId, fiatAmount, and phone are required",
      });
    }

    // Get conversion rate and calculate stablecoin amount
    const conversion = await convertFiatToStablecoin(
      fiatAmount,
      fiatCurrency,
      stablecoin
    );

    if (!conversion.success) {
      return res.status(400).json({
        error: "Conversion failed",
        details: conversion,
      });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Create deposit transaction with conversion details
    const transaction = await Transaction.create({
      userId,
      type: "deposit",
      amount: conversion.stablecoinAmount, // Amount in stablecoin
      currency: stablecoin,
      status: "pending", // Will be updated by M-Pesa callback
      paymentMethod,
      description: `Deposit ${fiatAmount} ${fiatCurrency} → ${conversion.stablecoinAmount} ${stablecoin} (Rate: ${conversion.rate})`,
      sender: phone,
      metadata: {
        fiatAmount,
        fiatCurrency,
        stablecoin,
        conversionRate: conversion.rate,
        conversionSource: conversion.source,
        conversionTimestamp: conversion.timestamp,
      },
      createdAt: new Date(),
    });

    console.log(`🟡 Yellow Card deposit initiated:`, {
      userId,
      fiatAmount: `${fiatAmount} ${fiatCurrency}`,
      stablecoinAmount: `${conversion.stablecoinAmount} ${stablecoin}`,
      rate: conversion.rate,
      transactionId: transaction._id.toString(),
    });

    res.json({
      success: true,
      transactionId: transaction._id.toString(),
      message:
        "Deposit initiated. Please complete M-Pesa payment on your phone.",
      fiatAmount,
      fiatCurrency,
      stablecoinAmount: conversion.stablecoinAmount,
      stablecoin,
      conversionRate: conversion.rate,
      conversionSource: conversion.source,
    });
  } catch (error) {
    console.error("Yellow Card deposit error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Convert stablecoin withdrawal to fiat using Yellow Card
router.post("/withdraw/stablecoin-to-fiat", async (req, res) => {
  try {
    const {
      userId,
      stablecoinAmount,
      stablecoin = "USDC",
      fiatCurrency = "KES",
      phone,
      paymentMethod = "mpesa",
    } = req.body;

    if (!userId || !stablecoinAmount || !phone) {
      return res.status(400).json({
        error: "userId, stablecoinAmount, and phone are required",
      });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Check sufficient balance
    if (stablecoinAmount > wallet.balance) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Get conversion rate and calculate fiat amount
    const { convertStablecoinToFiat } = await import(
      "../services/yellowcard.js"
    );
    const conversion = await convertStablecoinToFiat(
      stablecoinAmount,
      stablecoin,
      fiatCurrency
    );

    if (!conversion.success) {
      return res.status(400).json({
        error: "Conversion failed",
        details: conversion,
      });
    }

    // Create withdrawal transaction
    const transaction = await Transaction.create({
      userId,
      type: "withdraw",
      amount: stablecoinAmount, // Amount in stablecoin
      currency: stablecoin,
      status: "completed", // M-Pesa withdrawals are instant
      paymentMethod,
      description: `Withdraw ${stablecoinAmount} ${stablecoin} → ${conversion.fiatAmount} ${fiatCurrency} (Rate: ${conversion.rate})`,
      recipient: phone,
      metadata: {
        stablecoinAmount,
        stablecoin,
        fiatAmount: conversion.fiatAmount,
        fiatCurrency,
        conversionRate: conversion.rate,
        conversionSource: conversion.source,
        conversionTimestamp: conversion.timestamp,
      },
      createdAt: new Date(),
    });

    // Update wallet balance
    wallet.balance -= stablecoinAmount;
    wallet.updatedAt = new Date();
    await wallet.save();

    console.log(`🟡 Yellow Card withdrawal:`, {
      userId,
      stablecoinAmount: `${stablecoinAmount} ${stablecoin}`,
      fiatAmount: `${conversion.fiatAmount} ${fiatCurrency}`,
      rate: conversion.rate,
      transactionId: transaction._id.toString(),
    });

    res.json({
      success: true,
      transactionId: transaction._id.toString(),
      message: `Withdrawal successful. ${conversion.fiatAmount} ${fiatCurrency} sent to M-Pesa ${phone}`,
      stablecoinAmount,
      stablecoin,
      fiatAmount: conversion.fiatAmount,
      fiatCurrency,
      conversionRate: conversion.rate,
      conversionSource: conversion.source,
    });
  } catch (error) {
    console.error("Yellow Card withdrawal error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
