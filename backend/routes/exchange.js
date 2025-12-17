import express from "express";
import { ExchangeRate } from "../data/mongodb.js";
import { convertCurrency, getCachedRates } from "../services/exchangeRates.js";

const router = express.Router();

// Get all exchange rates (with auto-refresh)
router.get("/rates", async (req, res) => {
  try {
    const rates = await getCachedRates(60); // Cache for 60 minutes
    res.json(
      rates.map((r) => ({
        currency: r.currency,
        rate: r.rate,
        updatedAt: r.updatedAt,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific exchange rate
router.get("/rates/:currency", async (req, res) => {
  try {
    const currency = req.params.currency.toUpperCase();
    const rate = await ExchangeRate.findOne({ currency });

    if (!rate) {
      return res.status(404).json({ error: "Currency not found" });
    }

    res.json({ currency, rate: rate.rate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Convert between currencies (using real-time rates)
router.post("/convert", async (req, res) => {
  try {
    const { from, to, amount } = req.body;

    if (!from || !to || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid conversion parameters" });
    }

    const result = await convertCurrency(from, to, amount);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update exchange rate (admin only - add auth later)
router.put("/rates/:currency", async (req, res) => {
  try {
    const { rate } = req.body;
    const currency = req.params.currency.toUpperCase();

    if (!rate || rate <= 0) {
      return res.status(400).json({ error: "Invalid rate" });
    }

    const result = await query(
      "UPDATE exchange_rates SET rate = $1, updated_at = NOW() WHERE currency = $2 RETURNING *",
      [rate, currency]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Currency not found" });
    }

    res.json({ currency, rate: parseFloat(result.rows[0].rate) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
