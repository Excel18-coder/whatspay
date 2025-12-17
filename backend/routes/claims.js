import crypto from "crypto";
import express from "express";
import { Claim, User, Wallet } from "../data/mongodb.js";

const router = express.Router();

// Create a new claim link
router.post("/create", async (req, res) => {
  try {
    const { userId, amount, currency = "USDC", recipientPhone } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid claim data" });
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Deduct amount from sender's wallet
    wallet.balance -= amount;
    await wallet.save();

    // Generate unique claim code
    const claimCode = crypto.randomBytes(8).toString("hex");

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const claim = await Claim.create({
      senderId: userId,
      amount,
      currency,
      recipientPhone,
      claimCode,
      expiresAt,
      status: "pending",
    });

    // Generate claim link
    const claimLink = `${
      process.env.FRONTEND_URL || "http://localhost:8080"
    }/claim/${claim._id}`;

    res.status(201).json({
      id: claim._id.toString(),
      senderId: claim.senderId.toString(),
      amount: claim.amount,
      currency: claim.currency,
      recipientPhone: claim.recipientPhone,
      status: claim.status,
      claimCode: claim.claimCode,
      expiresAt: claim.expiresAt,
      claimLink,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get claim details
router.get("/:claimId", async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId);

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    // Check if expired
    if (new Date() > claim.expiresAt) {
      return res.status(410).json({ error: "Claim has expired" });
    }

    // Check if already claimed
    if (claim.status === "claimed") {
      return res.status(409).json({ error: "Claim already used" });
    }

    res.json(claim);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Claim money
router.post("/:claimId/claim", async (req, res) => {
  const client = await getClient();
  try {
    const { claimId } = req.params;
    const { phone, name } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ error: "Phone and name are required" });
    }

    await client.query("BEGIN");

    const claimResult = await client.query(
      "SELECT * FROM claims WHERE id = $1",
      [claimId]
    );
    if (claimResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Claim not found" });
    }

    const claim = claimResult.rows[0];

    if (claim.status === "claimed") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Claim already used" });
    }

    if (new Date() > new Date(claim.expires_at)) {
      await client.query("ROLLBACK");
      return res.status(410).json({ error: "Claim has expired" });
    }

    // Check if user exists, create if not
    let userResult = await client.query(
      "SELECT * FROM users WHERE phone = $1",
      [phone]
    );
    let user;

    if (userResult.rows.length === 0) {
      const avatar = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

      const newUserResult = await client.query(
        "INSERT INTO users (name, phone, avatar) VALUES ($1, $2, $3) RETURNING *",
        [name, phone, avatar]
      );
      user = newUserResult.rows[0];

      // Create wallet for new user
      await client.query(
        "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, $2, $3)",
        [user.id, 0, claim.currency]
      );
    } else {
      user = userResult.rows[0];
    }

    // Add money to recipient's wallet
    const walletResult = await client.query(
      "UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 RETURNING *",
      [claim.amount, user.id]
    );
    const wallet = walletResult.rows[0];

    // Create receive transaction
    const transactionResult = await client.query(
      "INSERT INTO transactions (user_id, type, amount, currency, metadata, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        user.id,
        "receive",
        claim.amount,
        claim.currency,
        JSON.stringify({ sender: claim.sender_name }),
        "completed",
      ]
    );
    const transaction = transactionResult.rows[0];

    // Update claim status
    const updatedClaimResult = await client.query(
      "UPDATE claims SET status = $1, claimed_by = $2, claimed_at = $3 WHERE id = $4 RETURNING *",
      ["claimed", user.id, new Date(), claimId]
    );
    const updatedClaim = updatedClaimResult.rows[0];

    await client.query("COMMIT");

    res.json({
      claim: updatedClaim,
      transaction,
      wallet,
      user,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Cancel claim (sender only)
router.post("/:claimId/cancel", async (req, res) => {
  const client = await getClient();
  try {
    const { claimId } = req.params;
    const { userId } = req.body;

    await client.query("BEGIN");

    const claimResult = await client.query(
      "SELECT * FROM claims WHERE id = $1",
      [claimId]
    );
    if (claimResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Claim not found" });
    }

    const claim = claimResult.rows[0];

    if (claim.sender_id !== userId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (claim.status === "claimed") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Cannot cancel claimed money" });
    }

    // Refund to sender
    await client.query(
      "UPDATE wallets SET balance = balance + $1 WHERE user_id = $2",
      [claim.amount, claim.sender_id]
    );

    const updatedClaimResult = await client.query(
      "UPDATE claims SET status = $1, cancelled_at = $2 WHERE id = $3 RETURNING *",
      ["cancelled", new Date(), claimId]
    );
    const updatedClaim = updatedClaimResult.rows[0];

    await client.query("COMMIT");

    res.json(updatedClaim);
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

export default router;
