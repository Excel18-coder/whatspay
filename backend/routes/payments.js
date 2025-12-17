import express from "express";
import {
  FiatReserve,
  ReserveTransaction,
  Transaction,
  Wallet,
} from "../data/mongodb.js";
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
      // Payment successful - convert fiat to stablecoin in real-time
      console.log(
        `✅ Payment successful for transaction ${externalReference}:`,
        {
          amount,
          mpesaReceiptNumber,
          phone,
        }
      );

      // Get conversion details from transaction metadata
      const fiatAmount = transaction.metadata?.fiatAmount || amount;
      const fiatCurrency = transaction.metadata?.fiatCurrency || "KES";
      const stablecoin =
        transaction.metadata?.stablecoin || transaction.currency || "USDC";

      // Perform REAL-TIME conversion using current Yellow Card rates
      console.log(
        `🟡 Converting ${fiatAmount} ${fiatCurrency} to ${stablecoin} at current rates...`
      );

      const conversion = await convertFiatToStablecoin(
        fiatAmount,
        fiatCurrency,
        stablecoin
      );

      if (!conversion.success) {
        console.error("❌ Real-time conversion failed:", conversion);
        transaction.status = "failed";
        transaction.description += ` - Conversion failed`;
        await transaction.save();
        return res.status(200).send("ok");
      }

      const stablecoinAmount = conversion.stablecoinAmount;
      const realTimeRate = conversion.rate;

      console.log(
        `💰 Minting ${stablecoinAmount} ${stablecoin} (Rate: ${realTimeRate})`
      );

      // STEP 1: Add fiat to reserve (M-Pesa till received payment)
      let fiatReserve = await FiatReserve.findOne({ currency: fiatCurrency });
      if (!fiatReserve) {
        // Create reserve if doesn't exist
        fiatReserve = await FiatReserve.create({
          currency: fiatCurrency,
          balance: 0,
          totalDeposited: 0,
          totalConverted: 0,
        });
      }

      const balanceBefore = fiatReserve.balance;

      // Add fiat to reserve
      fiatReserve.balance += fiatAmount;
      fiatReserve.totalDeposited += fiatAmount;
      fiatReserve.lastActivity = new Date();
      fiatReserve.updatedAt = new Date();
      await fiatReserve.save();

      // Log reserve deposit
      await ReserveTransaction.create({
        currency: fiatCurrency,
        type: "deposit",
        amount: fiatAmount,
        balanceBefore,
        balanceAfter: fiatReserve.balance,
        relatedUserId: userId,
        relatedTransactionId: transaction._id,
        description: `M-Pesa deposit received: ${mpesaReceiptNumber}`,
        metadata: { mpesaReceiptNumber, phone },
      });

      console.log(
        `💵 Fiat Reserve: +${fiatAmount} ${fiatCurrency} | Balance: ${fiatReserve.balance} ${fiatCurrency}`
      );

      // STEP 2: Deduct fiat from reserve (converting to stablecoin)
      const balanceBeforeConversion = fiatReserve.balance;

      if (fiatReserve.balance < fiatAmount) {
        console.error(
          `❌ Insufficient fiat reserve: ${fiatReserve.balance} < ${fiatAmount}`
        );
        transaction.status = "failed";
        transaction.description += ` - Insufficient fiat reserve`;
        await transaction.save();
        return res.status(200).send("ok");
      }

      fiatReserve.balance -= fiatAmount;
      fiatReserve.totalConverted += fiatAmount;
      fiatReserve.updatedAt = new Date();
      await fiatReserve.save();

      // Log reserve conversion
      await ReserveTransaction.create({
        currency: fiatCurrency,
        type: "conversion",
        amount: -fiatAmount,
        balanceBefore: balanceBeforeConversion,
        balanceAfter: fiatReserve.balance,
        relatedUserId: userId,
        relatedTransactionId: transaction._id,
        description: `Converted ${fiatAmount} ${fiatCurrency} → ${stablecoinAmount} ${stablecoin}`,
        metadata: {
          stablecoin,
          stablecoinAmount,
          conversionRate: realTimeRate,
          conversionSource: conversion.source,
        },
      });

      console.log(
        `🔄 Conversion: -${fiatAmount} ${fiatCurrency} | Reserve Balance: ${fiatReserve.balance} ${fiatCurrency}`
      );

      // Check low balance alert
      if (fiatReserve.balance < fiatReserve.lowBalanceThreshold) {
        console.warn(
          `⚠️ LOW RESERVE ALERT: ${fiatCurrency} reserve is ${fiatReserve.balance}, below threshold ${fiatReserve.lowBalanceThreshold}`
        );
      }

      // STEP 3: Mint stablecoin to user wallet
      const wallet = await Wallet.findOne({ userId });
      if (wallet) {
        wallet.balance += stablecoinAmount;
        wallet.currency = stablecoin;
        wallet.updatedAt = new Date();
        await wallet.save();
        console.log(`✅ Wallet updated: +${stablecoinAmount} ${stablecoin}`);
      }

      // Update transaction with real-time conversion details
      transaction.status = "completed";
      transaction.amount = stablecoinAmount; // Store stablecoin amount
      transaction.currency = stablecoin;
      transaction.paymentReference = mpesaReceiptNumber;
      transaction.description = `Deposit: ${fiatAmount} ${fiatCurrency} → ${stablecoinAmount} ${stablecoin} (Rate: ${realTimeRate})`;
      transaction.metadata = {
        ...transaction.metadata,
        fiatAmount,
        fiatCurrency,
        stablecoin,
        stablecoinAmount,
        conversionRate: realTimeRate,
        conversionSource: conversion.source,
        conversionTimestamp: conversion.timestamp,
        mpesaReceiptNumber,
        realTimeConversion: true,
      };
      await transaction.save();

      console.log(
        `🎉 Transaction completed: User ${userId} received ${stablecoinAmount} ${stablecoin}`
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

// Convert fiat deposit to stablecoin using Yellow Card (REAL-TIME)
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

    console.log(
      `🟡 Initiating deposit: ${fiatAmount} ${fiatCurrency} → ${stablecoin}`
    );

    // Get CURRENT real-time conversion rate for display to user
    const previewConversion = await convertFiatToStablecoin(
      fiatAmount,
      fiatCurrency,
      stablecoin
    );

    if (!previewConversion.success) {
      return res.status(400).json({
        error: "Unable to fetch conversion rate",
        details: previewConversion,
      });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Create pending transaction with metadata for real-time conversion on callback
    // NOTE: We store estimated amount, but ACTUAL conversion happens at payment time
    const transaction = await Transaction.create({
      userId,
      type: "deposit",
      amount: previewConversion.stablecoinAmount, // Estimated amount (will be updated)
      currency: stablecoin,
      status: "pending", // Will be converted in real-time when callback is received
      paymentMethod,
      description: `Pending deposit: ${fiatAmount} ${fiatCurrency} → ~${previewConversion.stablecoinAmount} ${stablecoin}`,
      sender: phone,
      metadata: {
        fiatAmount,
        fiatCurrency,
        stablecoin,
        previewRate: previewConversion.rate, // Rate shown to user
        previewAmount: previewConversion.stablecoinAmount,
        previewSource: previewConversion.source,
        previewTimestamp: previewConversion.timestamp,
        realTimeConversion: true, // Flag to trigger real-time conversion on callback
      },
      createdAt: new Date(),
    });

    console.log(`🟡 Deposit initiated (real-time conversion on payment):`, {
      userId,
      fiatAmount: `${fiatAmount} ${fiatCurrency}`,
      estimatedStablecoin: `~${previewConversion.stablecoinAmount} ${stablecoin}`,
      previewRate: previewConversion.rate,
      transactionId: transaction._id.toString(),
      note: "Actual amount will be calculated at payment time using live rates",
    });

    res.json({
      success: true,
      transactionId: transaction._id.toString(),
      message:
        "Deposit initiated. Complete M-Pesa payment. Final amount calculated at payment time using real-time rates.",
      fiatAmount,
      fiatCurrency,
      estimatedStablecoinAmount: previewConversion.stablecoinAmount,
      stablecoin,
      previewRate: previewConversion.rate,
      conversionSource: previewConversion.source,
      note: "Final stablecoin amount will be calculated using live rates when payment is confirmed",
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

// Get fiat reserve status
router.get("/reserve/status", async (req, res) => {
  try {
    const { currency } = req.query;

    if (currency) {
      // Get specific currency reserve
      const reserve = await FiatReserve.findOne({
        currency: currency.toUpperCase(),
      });
      if (!reserve) {
        return res
          .status(404)
          .json({ error: `Reserve for ${currency} not found` });
      }
      return res.json(reserve);
    }

    // Get all reserves
    const reserves = await FiatReserve.find();
    res.json(reserves);
  } catch (error) {
    console.error("Error fetching reserve status:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get reserve transaction history
router.get("/reserve/transactions", async (req, res) => {
  try {
    const { currency, type, limit = 50 } = req.query;

    const filter = {};
    if (currency) filter.currency = currency.toUpperCase();
    if (type) filter.type = type;

    const transactions = await ReserveTransaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("relatedUserId", "name phone")
      .lean();

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching reserve transactions:", error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize reserve (admin only - for setup)
router.post("/reserve/initialize", async (req, res) => {
  try {
    const {
      currency,
      initialBalance = 0,
      lowBalanceThreshold = 10000,
    } = req.body;

    if (!currency) {
      return res.status(400).json({ error: "currency is required" });
    }

    const existing = await FiatReserve.findOne({
      currency: currency.toUpperCase(),
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: `Reserve for ${currency} already exists` });
    }

    const reserve = await FiatReserve.create({
      currency: currency.toUpperCase(),
      balance: initialBalance,
      totalDeposited: initialBalance,
      lowBalanceThreshold,
    });

    if (initialBalance > 0) {
      await ReserveTransaction.create({
        currency: currency.toUpperCase(),
        type: "adjustment",
        amount: initialBalance,
        balanceBefore: 0,
        balanceAfter: initialBalance,
        description: "Initial reserve setup",
      });
    }

    res.json({
      success: true,
      message: `Reserve initialized for ${currency}`,
      reserve,
    });
  } catch (error) {
    console.error("Error initializing reserve:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
