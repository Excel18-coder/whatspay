import express from "express";
import { Transaction } from "../data/mongodb.js";

const router = express.Router();

// Get all transactions for a user
router.get("/", async (req, res) => {
  try {
    const { userId, type, status, limit } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const filter = { userId };

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    let query = Transaction.find(filter).sort({ createdAt: -1 });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const transactions = await query;

    res.json(
      transactions.map((tx) => ({
        id: tx._id.toString(),
        userId: tx.userId.toString(),
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        recipientPhone: tx.recipientPhone,
        senderPhone: tx.senderPhone,
        description: tx.description,
        paymentMethod: tx.paymentMethod,
        paymentReference: tx.paymentReference,
        createdAt: tx.createdAt,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single transaction
router.get("/:txId", async (req, res) => {
  try {
    const result = await query("SELECT * FROM transactions WHERE id = $1", [
      req.params.txId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create send transaction
router.post("/send", async (req, res) => {
  try {
    const {
      userId,
      recipient,
      amount,
      currency = "USDC",
      fee = 0.1,
    } = req.body;

    if (!userId || !recipient || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid transaction data" });
    }

    // Check wallet balance
    const walletResult = await query(
      "SELECT * FROM wallets WHERE user_id = $1",
      [userId]
    );
    if (walletResult.rows.length === 0) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const wallet = walletResult.rows[0];
    if (parseFloat(wallet.balance) < amount + fee) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Deduct from sender's wallet
    await query(
      "UPDATE wallets SET balance = balance - $1 WHERE user_id = $2",
      [amount + fee, userId]
    );

    // Create transaction
    const txResult = await query(
      "INSERT INTO transactions (user_id, type, amount, currency, recipient, fee, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [userId, "send", amount, currency, recipient, fee, "pending"]
    );

    res.status(201).json(txResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm transaction (update status)
router.patch("/:txId/status", async (req, res) => {
  try {
    const { status } = req.body;
    const { txId } = req.params;

    if (!["pending", "completed", "failed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await query(
      "UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *",
      [status, txId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
