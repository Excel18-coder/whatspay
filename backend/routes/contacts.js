import express from "express";
import { Contact } from "../data/mongodb.js";

const router = express.Router();

// Get all contacts for a user
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const contacts = await Contact.find({ userId }).sort({ name: 1 });
    res.json(
      contacts.map((c) => ({
        id: c._id.toString(),
        userId: c.userId.toString(),
        name: c.name,
        phone: c.phone,
        avatar: c.avatar,
        createdAt: c.createdAt,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new contact
router.post("/", async (req, res) => {
  try {
    const { userId, name, phone, avatar } = req.body;

    if (!userId || !name || !phone) {
      return res
        .status(400)
        .json({ error: "userId, name, and phone are required" });
    }

    const contactAvatar =
      avatar ||
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    const contact = await Contact.create({
      userId,
      name,
      phone,
      avatar: contactAvatar,
    });

    res.status(201).json({
      id: contact._id.toString(),
      userId: contact.userId.toString(),
      name: contact.name,
      phone: contact.phone,
      avatar: contact.avatar,
      createdAt: contact.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search contacts
router.get("/search", async (req, res) => {
  try {
    const { userId, query: searchQuery } = req.query;

    if (!userId || !searchQuery) {
      return res.status(400).json({ error: "userId and query are required" });
    }

    const result = await query(
      "SELECT * FROM contacts WHERE user_id = $1 AND (LOWER(name) LIKE LOWER($2) OR phone LIKE $2)",
      [userId, `%${searchQuery}%`]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
