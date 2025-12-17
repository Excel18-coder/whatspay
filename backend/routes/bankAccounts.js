import express from "express";
import { BankAccount, Transaction, Wallet } from "../data/mongodb.js";

const router = express.Router();

// Get all bank accounts for a user
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const accounts = await BankAccount.find({ userId }).sort({
      isPrimary: -1,
      createdAt: -1,
    });

    res.json(
      accounts.map((acc) => ({
        id: acc._id.toString(),
        userId: acc.userId.toString(),
        accountName: acc.accountName,
        accountNumber: acc.accountNumber,
        bankName: acc.bankName,
        bankCode: acc.bankCode,
        branchName: acc.branchName,
        branchCode: acc.branchCode,
        swiftCode: acc.swiftCode,
        currency: acc.currency,
        isPrimary: acc.isPrimary,
        isVerified: acc.isVerified,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single bank account
router.get("/:accountId", async (req, res) => {
  try {
    const account = await BankAccount.findById(req.params.accountId);

    if (!account) {
      return res.status(404).json({ error: "Bank account not found" });
    }

    res.json({
      id: account._id.toString(),
      userId: account.userId.toString(),
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      bankCode: account.bankCode,
      branchName: account.branchName,
      branchCode: account.branchCode,
      swiftCode: account.swiftCode,
      currency: account.currency,
      isPrimary: account.isPrimary,
      isVerified: account.isVerified,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new bank account
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      accountName,
      accountNumber,
      bankName,
      bankCode,
      branchName,
      branchCode,
      swiftCode,
      currency = "KES",
      isPrimary = false,
    } = req.body;

    // Validate required fields
    if (!userId || !accountName || !accountNumber || !bankName) {
      return res.status(400).json({
        error:
          "Missing required fields: userId, accountName, accountNumber, bankName",
      });
    }

    // Check if account number already exists for this user
    const existingAccount = await BankAccount.findOne({
      userId,
      accountNumber,
    });
    if (existingAccount) {
      return res.status(400).json({
        error: "This account number is already registered",
      });
    }

    // If setting as primary, unset other primary accounts
    if (isPrimary) {
      await BankAccount.updateMany(
        { userId, isPrimary: true },
        { isPrimary: false }
      );
    }

    // Create new bank account
    const account = await BankAccount.create({
      userId,
      accountName,
      accountNumber,
      bankName,
      bankCode,
      branchName,
      branchCode,
      swiftCode,
      currency,
      isPrimary,
      isVerified: false, // Manual verification required
    });

    res.status(201).json({
      id: account._id.toString(),
      userId: account.userId.toString(),
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      bankCode: account.bankCode,
      branchName: account.branchName,
      branchCode: account.branchCode,
      swiftCode: account.swiftCode,
      currency: account.currency,
      isPrimary: account.isPrimary,
      isVerified: account.isVerified,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update bank account
router.patch("/:accountId", async (req, res) => {
  try {
    const {
      accountName,
      accountNumber,
      bankName,
      bankCode,
      branchName,
      branchCode,
      swiftCode,
      currency,
      isPrimary,
    } = req.body;

    const account = await BankAccount.findById(req.params.accountId);

    if (!account) {
      return res.status(404).json({ error: "Bank account not found" });
    }

    // If setting as primary, unset other primary accounts
    if (isPrimary && !account.isPrimary) {
      await BankAccount.updateMany(
        { userId: account.userId, isPrimary: true },
        { isPrimary: false }
      );
    }

    // Update fields
    if (accountName) account.accountName = accountName;
    if (accountNumber) account.accountNumber = accountNumber;
    if (bankName) account.bankName = bankName;
    if (bankCode !== undefined) account.bankCode = bankCode;
    if (branchName !== undefined) account.branchName = branchName;
    if (branchCode !== undefined) account.branchCode = branchCode;
    if (swiftCode !== undefined) account.swiftCode = swiftCode;
    if (currency) account.currency = currency;
    if (isPrimary !== undefined) account.isPrimary = isPrimary;
    account.updatedAt = new Date();

    await account.save();

    res.json({
      id: account._id.toString(),
      userId: account.userId.toString(),
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      bankCode: account.bankCode,
      branchName: account.branchName,
      branchCode: account.branchCode,
      swiftCode: account.swiftCode,
      currency: account.currency,
      isPrimary: account.isPrimary,
      isVerified: account.isVerified,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete bank account
router.delete("/:accountId", async (req, res) => {
  try {
    const account = await BankAccount.findByIdAndDelete(req.params.accountId);

    if (!account) {
      return res.status(404).json({ error: "Bank account not found" });
    }

    res.json({ message: "Bank account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Withdraw to bank account
router.post("/:accountId/withdraw", async (req, res) => {
  try {
    const { userId, amount, currency = "USDC" } = req.body;
    const { accountId } = req.params;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid withdrawal parameters" });
    }

    // Get bank account
    const bankAccount = await BankAccount.findById(accountId);
    if (!bankAccount) {
      return res.status(404).json({ error: "Bank account not found" });
    }

    if (!bankAccount.isVerified) {
      return res.status(400).json({
        error: "Bank account must be verified before withdrawals",
      });
    }

    // Get user wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Check sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Deduct from wallet
    wallet.balance -= amount;
    wallet.updatedAt = new Date();
    await wallet.save();

    // Create withdrawal transaction
    const transaction = await Transaction.create({
      userId,
      type: "withdraw",
      amount,
      currency,
      status: "pending", // Will be completed when bank processes
      paymentMethod: "bank_transfer",
      paymentReference: `BANK-${Date.now()}`,
      description: `Withdrawal to ${bankAccount.bankName} (${bankAccount.accountNumber})`,
    });

    res.json({
      success: true,
      message: "Withdrawal initiated successfully",
      transaction: {
        id: transaction._id.toString(),
        amount,
        currency,
        status: transaction.status,
        bankAccount: {
          accountName: bankAccount.accountName,
          accountNumber: bankAccount.accountNumber,
          bankName: bankAccount.bankName,
        },
      },
      wallet: {
        balance: wallet.balance,
        currency: wallet.currency,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
