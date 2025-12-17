import express from "express";
import { Transaction, Wallet } from "../data/mongodb.js";
import { getCachedRates } from "../services/exchangeRates.js";
import { initiateStkPush } from "../services/lipia.js";

const router = express.Router();

// Get wallet for user
router.get("/:userId", async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.params.userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Get real-time exchange rate to calculate local balance
    const rates = await getCachedRates(60);
    const kesRate = rates.find((r) => r.currency === "KES");
    const exchangeRate = kesRate?.rate || 129.5;
    const localBalance = wallet.balance * exchangeRate;

    res.json({
      id: wallet._id.toString(),
      userId: wallet.userId.toString(),
      balance: wallet.balance,
      currency: wallet.currency,
      localBalance,
      exchangeRate,
      ratesUpdatedAt: kesRate?.updatedAt,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deposit to wallet (M-Pesa via Lipia Online)
router.post("/:userId/deposit", async (req, res) => {
  try {
    const {
      amount,
      currency = "USDC",
      method = "mpesa",
      phoneNumber,
      localAmount,
      localCurrency = "KES",
    } = req.body;
    const { userId } = req.params;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Check if method is M-Pesa and phone number is provided
    if (method === "mpesa") {
      if (!phoneNumber) {
        return res
          .status(400)
          .json({ error: "Phone number is required for M-Pesa deposits" });
      }

      if (!localAmount || localAmount <= 0) {
        return res
          .status(400)
          .json({ error: "Local amount is required for M-Pesa deposits" });
      }

      // Create pending transaction record first
      const transaction = await Transaction.create({
        userId,
        type: "deposit",
        amount,
        currency,
        status: "pending",
        paymentMethod: "mpesa",
        description: `M-Pesa deposit of ${localCurrency} ${localAmount}`,
      });

      // Initiate M-Pesa STK push via Lipia
      const stkResult = await initiateStkPush({
        phoneNumber,
        amount: Math.round(localAmount), // Amount in KES
        externalReference: transaction._id.toString(), // Use transaction ID as reference
        metadata: {
          userId,
          usdcAmount: amount,
          currency,
        },
      });

      if (!stkResult.success) {
        // Update transaction to failed
        transaction.status = "failed";
        await transaction.save();

        return res.status(400).json({
          error: stkResult.error || "Failed to initiate M-Pesa payment",
          errorCode: stkResult.errorCode,
        });
      }

      // Store payment reference in transaction
      transaction.paymentReference = stkResult.transactionReference;
      await transaction.save();

      // STK push initiated successfully
      res.json({
        success: true,
        message:
          "STK push sent to your phone. Please enter your M-Pesa PIN to complete the payment.",
        transaction: {
          id: transaction._id.toString(),
          status: "pending",
          amount: amount,
          currency: currency,
          localAmount: localAmount,
          localCurrency: localCurrency,
        },
        payment: {
          transactionReference: stkResult.transactionReference,
          responseDescription: stkResult.responseDescription,
        },
      });
    } else {
      // Direct deposit for other methods (card, bank, etc.)
      // Update wallet balance immediately
      const wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      wallet.balance += amount;
      wallet.updatedAt = new Date();
      await wallet.save();

      // Create completed transaction record
      const transaction = await Transaction.create({
        userId,
        type: "deposit",
        amount,
        currency,
        status: "completed",
        paymentMethod: method,
        description: `${method} deposit`,
      });

      res.json({
        wallet: {
          id: wallet._id.toString(),
          balance: wallet.balance,
          currency: wallet.currency,
        },
        transaction: {
          id: transaction._id.toString(),
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
        },
      });
    }
  } catch (error) {
    console.error("Deposit error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Withdraw from wallet
router.post("/:userId/withdraw", async (req, res) => {
  try {
    const { amount, currency = "USDC", fee = 0.5 } = req.body;
    const { userId } = req.params;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Check wallet balance
    const walletCheck = await query(
      "SELECT * FROM wallets WHERE user_id = $1",
      [userId]
    );
    if (walletCheck.rows.length === 0) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const wallet = walletCheck.rows[0];
    if (parseFloat(wallet.balance) < amount + fee) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Update wallet balance
    const updatedWalletResult = await query(
      "UPDATE wallets SET balance = balance - $1 WHERE user_id = $2 RETURNING *",
      [amount + fee, userId]
    );
    const updatedWallet = updatedWalletResult.rows[0];

    // Create transaction record
    const txResult = await query(
      "INSERT INTO transactions (user_id, type, amount, currency, fee, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [userId, "withdraw", amount, currency, fee, "completed"]
    );
    const transaction = txResult.rows[0];

    res.json({ wallet: updatedWallet, transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Convert currency
router.post("/:userId/convert", async (req, res) => {
  try {
    const { fromCurrency, toCurrency, amount } = req.body;
    const { userId } = req.params;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Get exchange rates
    const fromRateResult = await query(
      "SELECT rate FROM exchange_rates WHERE currency = $1",
      [fromCurrency]
    );
    const toRateResult = await query(
      "SELECT rate FROM exchange_rates WHERE currency = $1",
      [toCurrency]
    );

    if (fromRateResult.rows.length === 0 || toRateResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid currency" });
    }

    const fromRate = parseFloat(fromRateResult.rows[0].rate);
    const toRate = parseFloat(toRateResult.rows[0].rate);
    const convertedAmount = (amount / fromRate) * toRate;
    const exchangeRate = toRate / fromRate;

    // Create transaction record with metadata
    const txResult = await query(
      "INSERT INTO transactions (user_id, type, amount, currency, status, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        userId,
        "convert",
        convertedAmount,
        toCurrency,
        "completed",
        JSON.stringify({ fromCurrency, fromAmount: amount, exchangeRate }),
      ]
    );
    const transaction = txResult.rows[0];

    res.json({
      convertedAmount,
      fromAmount: amount,
      fromCurrency,
      toCurrency,
      exchangeRate,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
