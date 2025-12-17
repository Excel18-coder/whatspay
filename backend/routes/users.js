import express from "express";
import { User, Wallet } from "../data/mongodb.js";

const router = express.Router();

// Get current user (first user for now)
router.get("/me", async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ id: user._id.toString(), ...user.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by phone number (for login)
router.get("/phone/:phone", async (req, res) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ id: user._id.toString(), ...user.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ id: user._id.toString(), ...user.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User with this phone already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      phone,
      avatar:
        avatar ||
        name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
    });

    // Create wallet for user
    const wallet = await Wallet.create({
      userId: user._id,
      balance: 0,
      currency: "USDC",
    });

    res.status(201).json({
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      kycStatus: user.kycStatus,
      wallet: {
        id: wallet._id.toString(),
        balance: wallet.balance,
        currency: wallet.currency,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.patch("/:userId", async (req, res) => {
  try {
    const {
      name,
      avatar,
      kycStatus,
      profilePicture,
      email,
      dateOfBirth,
      address,
      city,
      country,
    } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;
    if (kycStatus) updates.kycStatus = kycStatus;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture; // Allow clearing
    if (email !== undefined) updates.email = email;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (country !== undefined) updates.country = country;
    updates.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(req.params.userId, updates, {
      new: true,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ id: user._id.toString(), ...user.toObject() });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get user limits (returns default limits for now)
router.get("/:userId/limits", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return default limits (can be customized per user later)
    res.json({
      dailyLimit: 10000,
      dailyUsed: 0,
      dailyRemaining: 10000,
      monthlyLimit: 100000,
      monthlyUsed: 0,
      monthlyRemaining: 100000,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
