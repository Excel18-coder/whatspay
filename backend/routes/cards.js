import express from "express";
import { Card } from "../data/mongodb.js";

const router = express.Router();

// Get all cards for a user
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const cards = await Card.find({ userId }).sort({
      isPrimary: -1,
      createdAt: -1,
    });
    res.json(
      cards.map((card) => ({
        id: card._id.toString(),
        ...card.toObject(),
        _id: undefined,
      }))
    );
  } catch (error) {
    console.error("Get cards error:", error);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

// Get single card
router.get("/:cardId", async (req, res) => {
  try {
    const { cardId } = req.params;
    const card = await Card.findById(cardId);

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json({
      id: card._id.toString(),
      ...card.toObject(),
      _id: undefined,
    });
  } catch (error) {
    console.error("Get card error:", error);
    res.status(500).json({ error: "Failed to fetch card" });
  }
});

// Add new card
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      cardholderName,
      cardNumber,
      cardType,
      expiryMonth,
      expiryYear,
      cvv,
      billingAddress,
      billingCity,
      billingCountry,
      billingPostalCode,
      isPrimary,
    } = req.body;

    // Validate required fields
    if (
      !userId ||
      !cardholderName ||
      !cardNumber ||
      !cardType ||
      !expiryMonth ||
      !expiryYear
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: userId, cardholderName, cardNumber, cardType, expiryMonth, expiryYear",
      });
    }

    // Validate card number (basic check)
    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      return res.status(400).json({ error: "Invalid card number" });
    }

    // Check for duplicate card (same last 4 digits for same user)
    const last4Digits = cleanCardNumber.slice(-4);
    const existingCard = await Card.findOne({
      userId,
      cardNumber: { $regex: last4Digits + "$" },
    });

    if (existingCard) {
      return res.status(400).json({ error: "Card already exists" });
    }

    // Validate expiry date
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const expYear = parseInt(expiryYear);
    const expMonth = parseInt(expiryMonth);

    if (
      expYear < currentYear ||
      (expYear === currentYear && expMonth < currentMonth)
    ) {
      return res.status(400).json({ error: "Card has expired" });
    }

    // If this is set as primary, unset other primary cards
    if (isPrimary) {
      await Card.updateMany({ userId, isPrimary: true }, { isPrimary: false });
    }

    // Store only last 4 digits for security (in production, use tokenization)
    const maskedCardNumber = `****${last4Digits}`;

    const newCard = new Card({
      userId,
      cardholderName,
      cardNumber: maskedCardNumber,
      cardType: cardType.toLowerCase(),
      expiryMonth: expiryMonth.padStart(2, "0"),
      expiryYear,
      cvv, // In production, NEVER store CVV
      billingAddress,
      billingCity,
      billingCountry: billingCountry || "Kenya",
      billingPostalCode,
      isPrimary: isPrimary || false,
      isVerified: true, // Auto-verify for demo purposes
      updatedAt: new Date(),
    });

    await newCard.save();
    res.status(201).json(newCard);
  } catch (error) {
    console.error("Add card error:", error);
    res.status(500).json({ error: "Failed to add card" });
  }
});

// Update card
router.patch("/:cardId", async (req, res) => {
  try {
    const { cardId } = req.params;
    const updates = req.body;

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    // If setting as primary, unset other primary cards
    if (updates.isPrimary === true) {
      await Card.updateMany(
        { userId: card.userId, _id: { $ne: cardId }, isPrimary: true },
        { isPrimary: false }
      );
    }

    // Update allowed fields
    const allowedUpdates = [
      "cardholderName",
      "expiryMonth",
      "expiryYear",
      "billingAddress",
      "billingCity",
      "billingCountry",
      "billingPostalCode",
      "isPrimary",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        card[field] = updates[field];
      }
    });

    card.updatedAt = new Date();
    await card.save();

    res.json(card);
  } catch (error) {
    console.error("Update card error:", error);
    res.status(500).json({ error: "Failed to update card" });
  }
});

// Delete card
router.delete("/:cardId", async (req, res) => {
  try {
    const { cardId } = req.params;

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    await Card.findByIdAndDelete(cardId);
    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    console.error("Delete card error:", error);
    res.status(500).json({ error: "Failed to delete card" });
  }
});

// Deposit using card
router.post("/:cardId/deposit", async (req, res) => {
  try {
    const { cardId } = req.params;
    const { userId, amount, currency } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid request parameters" });
    }

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    if (!card.isVerified) {
      return res.status(400).json({ error: "Card is not verified" });
    }

    // In production, this would integrate with a payment gateway (Stripe, PayPal, etc.)
    // For demo purposes, we'll simulate a successful deposit

    // Import models dynamically to avoid circular dependencies
    const { Wallet, Transaction } = await import("../data/mongodb.js");

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // For demo: assume 1:1 conversion for simplicity
    const depositAmount = parseFloat(amount);
    wallet.balance += depositAmount;
    wallet.updatedAt = new Date();
    await wallet.save();

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: "deposit",
      amount: depositAmount,
      currency: currency || "USDT",
      status: "completed",
      method: "card",
      description: `Card deposit (${card.cardType} ${card.cardNumber})`,
      createdAt: new Date(),
    });
    await transaction.save();

    res.json({
      message: "Deposit successful",
      transaction,
      newBalance: wallet.balance,
    });
  } catch (error) {
    console.error("Card deposit error:", error);
    res.status(500).json({ error: "Deposit failed" });
  }
});

export default router;
