import axios from "axios";
import { ExchangeRate } from "../data/mongodb.js";

// Using exchangerate-api.com (free tier: 1,500 requests/month)
// Alternative: use openexchangerates.org, fixer.io, or currencyapi.com
const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD";

// Fallback rates in case API fails
const FALLBACK_RATES = {
  KES: 129.5,
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  USDC: 1.0, // USDC is pegged to USD
};

/**
 * Fetch real-time exchange rates from API with retry logic
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<Object>} Exchange rates object
 */
export async function fetchRealTimeRates(retries = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `Fetching real-time exchange rates... (Attempt ${attempt}/${retries})`
      );

      const response = await axios.get(EXCHANGE_API_URL, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          Accept: "application/json",
        },
      });

      if (response.data && response.data.rates) {
        const rates = response.data.rates;

        // Add USDC (pegged to USD)
        rates.USDC = 1.0;
        rates.USDT = 1.0; // USDT also pegged to USD

        console.log("✅ Real-time rates fetched successfully");
        return {
          success: true,
          rates,
          timestamp: new Date(),
          source: "exchangerate-api.com",
        };
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error("❌ All retry attempts failed, using fallback rates");
  return {
    success: false,
    rates: FALLBACK_RATES,
    timestamp: new Date(),
    source: "fallback",
    error: lastError?.message,
  };
}

/**
 * Update database with latest exchange rates
 * @param {Object} rates - Rates object from API
 * @returns {Promise<void>}
 */
export async function updateDatabaseRates(rates) {
  try {
    const currencies = ["KES", "USD", "EUR", "GBP", "USDC"];

    for (const currency of currencies) {
      if (rates[currency]) {
        await ExchangeRate.findOneAndUpdate(
          { currency },
          {
            rate: rates[currency],
            updatedAt: new Date(),
          },
          { upsert: true, new: true }
        );
      }
    }

    console.log("✅ Database rates updated");
  } catch (error) {
    console.error("❌ Failed to update database rates:", error.message);
    throw error;
  }
}

/**
 * Get cached rates from database with auto-refresh
 * @param {number} maxAgeMinutes - Maximum age of cached rates in minutes
 * @returns {Promise<Object>} Exchange rates from database
 */
export async function getCachedRates(maxAgeMinutes = 60) {
  try {
    let rates = await ExchangeRate.find().lean(); // Use lean() for better performance

    if (rates.length === 0) {
      // No rates in database, fetch and store
      console.log("📭 No rates in database, fetching...");
      const { rates: freshRates, success } = await fetchRealTimeRates();

      if (success) {
        await updateDatabaseRates(freshRates);
        rates = await ExchangeRate.find().lean();
      } else {
        // If fetch failed, seed with fallback rates
        console.log("⚠️ Using fallback rates as seed data");
        await updateDatabaseRates(FALLBACK_RATES);
        rates = await ExchangeRate.find().lean();
      }

      return rates;
    }

    // Check if rates are stale
    const oldestRate = rates.reduce((oldest, rate) => {
      return !oldest || new Date(rate.updatedAt) < new Date(oldest.updatedAt)
        ? rate
        : oldest;
    }, null);

    const ageInMinutes =
      (Date.now() - new Date(oldestRate.updatedAt).getTime()) / (1000 * 60);

    if (ageInMinutes > maxAgeMinutes) {
      console.log(
        `⏰ Rates are ${Math.round(
          ageInMinutes
        )} minutes old, refreshing in background...`
      );

      // Refresh in background, return cached data immediately
      fetchRealTimeRates()
        .then(({ rates: freshRates, success }) => {
          if (success) {
            return updateDatabaseRates(freshRates);
          }
        })
        .catch((err) =>
          console.error("Background refresh failed:", err.message)
        );

      // Return stale data immediately (better UX)
      return rates;
    }

    return rates;
  } catch (error) {
    console.error("❌ Failed to get cached rates:", error.message);

    // Return fallback rates as last resort
    const fallbackArray = Object.entries(FALLBACK_RATES).map(
      ([currency, rate]) => ({
        currency,
        rate,
        updatedAt: new Date(),
      })
    );

    return fallbackArray;
  }
}

/**
 * Convert amount between currencies using real-time rates
 * @param {string} from - Source currency code
 * @param {string} to - Target currency code
 * @param {number} amount - Amount to convert
 * @returns {Promise<Object>} Conversion result
 */
export async function convertCurrency(from, to, amount) {
  try {
    const rates = await getCachedRates(60); // Cache for 60 minutes

    const fromRate = rates.find((r) => r.currency === from.toUpperCase());
    const toRate = rates.find((r) => r.currency === to.toUpperCase());

    if (!fromRate || !toRate) {
      throw new Error(`Currency not found: ${!fromRate ? from : to}`);
    }

    // Convert through USD as base currency
    const usdAmount = amount / fromRate.rate;
    const convertedAmount = usdAmount * toRate.rate;
    const exchangeRate = toRate.rate / fromRate.rate;

    return {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount,
      convertedAmount,
      exchangeRate,
      timestamp: new Date().toISOString(),
      ratesUpdatedAt: fromRate.updatedAt,
    };
  } catch (error) {
    console.error("❌ Currency conversion failed:", error.message);
    throw error;
  }
}

/**
 * Start background job to refresh rates periodically
 * @param {number} intervalMinutes - Refresh interval in minutes
 */
export function startRateRefreshJob(intervalMinutes = 60) {
  console.log(
    `🔄 Starting rate refresh job (every ${intervalMinutes} minutes)`
  );

  // Initial fetch
  fetchRealTimeRates()
    .then(({ rates }) => updateDatabaseRates(rates))
    .catch((error) =>
      console.error("Initial rate fetch failed:", error.message)
    );

  // Periodic refresh
  setInterval(async () => {
    try {
      const { rates } = await fetchRealTimeRates();
      await updateDatabaseRates(rates);
    } catch (error) {
      console.error("Scheduled rate refresh failed:", error.message);
    }
  }, intervalMinutes * 60 * 1000);
}
