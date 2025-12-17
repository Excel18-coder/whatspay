import express from "express";
import { Transaction, Wallet } from "../data/mongodb.js";
import { validateCallback } from "../services/lipia.js";

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

export default router;
