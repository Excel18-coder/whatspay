import axios from "axios";

// Yellow Card API configuration
const YELLOWCARD_API_URL =
  process.env.YELLOWCARD_API_URL || "https://api.yellowcard.io/v1";
const YELLOWCARD_API_KEY = process.env.YELLOWCARD_API_KEY;
const YELLOWCARD_SECRET = process.env.YELLOWCARD_SECRET;

/**
 * Get Yellow Card authentication headers
 */
function getYellowCardHeaders() {
  if (!YELLOWCARD_API_KEY) {
    throw new Error("YELLOWCARD_API_KEY not configured");
  }

  return {
    "Content-Type": "application/json",
    "X-YC-Api-Key": YELLOWCARD_API_KEY,
    "X-YC-Timestamp": Date.now().toString(),
  };
}

/**
 * Fetch real-time crypto buy/sell rates from Yellow Card
 * Supports conversion from fiat (KES, NGN, etc.) to crypto (USDT, USDC, cUSDC)
 * @returns {Promise<Object>} Rates object with buy/sell prices
 */
export async function fetchYellowCardRates() {
  try {
    console.log("🟡 Fetching rates from Yellow Card API...");

    const response = await axios.get(`${YELLOWCARD_API_URL}/rates`, {
      headers: getYellowCardHeaders(),
      timeout: 15000,
    });

    // Yellow Card returns rates in format:
    // {
    //   "KES": {
    //     "USDT": { "buy": 129.50, "sell": 131.20 },
    //     "USDC": { "buy": 129.45, "sell": 131.15 },
    //     "cUSDC": { "buy": 129.40, "sell": 131.10 }
    //   },
    //   "NGN": { ... }
    // }

    console.log("✅ Yellow Card rates fetched successfully");
    return {
      success: true,
      rates: response.data,
      timestamp: new Date(),
      source: "YellowCard",
    };
  } catch (error) {
    console.error("❌ Yellow Card API error:", error.message);

    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }

    return {
      success: false,
      error: error.message,
      rates: getYellowCardFallbackRates(),
      timestamp: new Date(),
      source: "Fallback",
    };
  }
}

/**
 * Get conversion rate from fiat to stablecoin
 * @param {string} fiatCurrency - Fiat currency code (KES, NGN, etc.)
 * @param {string} stablecoin - Stablecoin code (USDT, USDC, cUSDC)
 * @param {string} type - "buy" (user buying crypto) or "sell" (user selling crypto)
 * @returns {Promise<Object>} Rate information
 */
export async function getConversionRate(
  fiatCurrency,
  stablecoin,
  type = "buy"
) {
  try {
    const ratesData = await fetchYellowCardRates();

    if (!ratesData.success || !ratesData.rates[fiatCurrency]) {
      throw new Error(`Rates not available for ${fiatCurrency}`);
    }

    const currencyRates = ratesData.rates[fiatCurrency];

    if (!currencyRates[stablecoin]) {
      throw new Error(`${stablecoin} not available for ${fiatCurrency}`);
    }

    const rate = currencyRates[stablecoin][type];

    return {
      success: true,
      fiatCurrency,
      stablecoin,
      type,
      rate,
      timestamp: ratesData.timestamp,
      source: ratesData.source,
    };
  } catch (error) {
    console.error("Error getting conversion rate:", error.message);

    // Return fallback rate
    const fallbackRates = getYellowCardFallbackRates();
    const rate = fallbackRates[fiatCurrency]?.[stablecoin]?.[type] || 130;

    return {
      success: false,
      fiatCurrency,
      stablecoin,
      type,
      rate,
      timestamp: new Date(),
      source: "Fallback",
      error: error.message,
    };
  }
}

/**
 * Convert fiat amount to stablecoin amount
 * @param {number} fiatAmount - Amount in fiat currency
 * @param {string} fiatCurrency - Fiat currency code
 * @param {string} stablecoin - Target stablecoin
 * @returns {Promise<Object>} Conversion result
 */
export async function convertFiatToStablecoin(
  fiatAmount,
  fiatCurrency,
  stablecoin
) {
  try {
    console.log(
      `🔄 Converting ${fiatAmount} ${fiatCurrency} to ${stablecoin}...`
    );

    const rateInfo = await getConversionRate(fiatCurrency, stablecoin, "buy");

    // User is buying crypto, so we use the buy rate
    // Amount in stablecoin = Fiat Amount / Buy Rate
    const stablecoinAmount = fiatAmount / rateInfo.rate;

    console.log(
      `✅ Conversion: ${fiatAmount} ${fiatCurrency} = ${stablecoinAmount.toFixed(
        4
      )} ${stablecoin}`
    );

    return {
      success: true,
      fiatAmount,
      fiatCurrency,
      stablecoin,
      stablecoinAmount: parseFloat(stablecoinAmount.toFixed(4)),
      rate: rateInfo.rate,
      type: "buy",
      timestamp: new Date(),
      source: rateInfo.source,
    };
  } catch (error) {
    console.error("Conversion error:", error.message);
    throw error;
  }
}

/**
 * Convert stablecoin amount to fiat amount
 * @param {number} stablecoinAmount - Amount in stablecoin
 * @param {string} stablecoin - Stablecoin code
 * @param {string} fiatCurrency - Target fiat currency
 * @returns {Promise<Object>} Conversion result
 */
export async function convertStablecoinToFiat(
  stablecoinAmount,
  stablecoin,
  fiatCurrency
) {
  try {
    console.log(
      `🔄 Converting ${stablecoinAmount} ${stablecoin} to ${fiatCurrency}...`
    );

    const rateInfo = await getConversionRate(fiatCurrency, stablecoin, "sell");

    // User is selling crypto, so we use the sell rate
    // Amount in fiat = Stablecoin Amount * Sell Rate
    const fiatAmount = stablecoinAmount * rateInfo.rate;

    console.log(
      `✅ Conversion: ${stablecoinAmount} ${stablecoin} = ${fiatAmount.toFixed(
        2
      )} ${fiatCurrency}`
    );

    return {
      success: true,
      stablecoinAmount,
      stablecoin,
      fiatCurrency,
      fiatAmount: parseFloat(fiatAmount.toFixed(2)),
      rate: rateInfo.rate,
      type: "sell",
      timestamp: new Date(),
      source: rateInfo.source,
    };
  } catch (error) {
    console.error("Conversion error:", error.message);
    throw error;
  }
}

/**
 * Fallback rates when Yellow Card API is unavailable
 */
function getYellowCardFallbackRates() {
  return {
    KES: {
      USDT: { buy: 129.5, sell: 131.2 },
      USDC: { buy: 129.45, sell: 131.15 },
      cUSDC: { buy: 129.4, sell: 131.1 },
    },
    NGN: {
      USDT: { buy: 1620.0, sell: 1640.0 },
      USDC: { buy: 1618.0, sell: 1638.0 },
      cUSDC: { buy: 1615.0, sell: 1635.0 },
    },
    UGX: {
      USDT: { buy: 3700.0, sell: 3750.0 },
      USDC: { buy: 3695.0, sell: 3745.0 },
      cUSDC: { buy: 3690.0, sell: 3740.0 },
    },
    TZS: {
      USDT: { buy: 2500.0, sell: 2530.0 },
      USDC: { buy: 2498.0, sell: 2528.0 },
      cUSDC: { buy: 2495.0, sell: 2525.0 },
    },
    GHS: {
      USDT: { buy: 15.5, sell: 15.7 },
      USDC: { buy: 15.48, sell: 15.68 },
      cUSDC: { buy: 15.45, sell: 15.65 },
    },
    ZAR: {
      USDT: { buy: 18.2, sell: 18.45 },
      USDC: { buy: 18.18, sell: 18.43 },
      cUSDC: { buy: 18.15, sell: 18.4 },
    },
  };
}

/**
 * Get list of supported currencies and stablecoins
 */
export function getSupportedCurrencies() {
  return {
    fiatCurrencies: ["KES", "NGN", "UGX", "TZS", "GHS", "ZAR"],
    stablecoins: ["USDT", "USDC", "cUSDC"],
  };
}

/**
 * Validate if currency pair is supported
 */
export function isCurrencyPairSupported(fiatCurrency, stablecoin) {
  const supported = getSupportedCurrencies();
  return (
    supported.fiatCurrencies.includes(fiatCurrency) &&
    supported.stablecoins.includes(stablecoin)
  );
}
