# Yellow Card API Integration

This document explains how to integrate Yellow Card API for converting fiat currency deposits to stablecoins (USDT, USDC, cUSDC).

## Overview

Yellow Card is Africa's leading cryptocurrency exchange platform. This integration allows users to:

1. **Deposit fiat → Get stablecoins**: Users deposit KES via M-Pesa and receive USDC/USDT in their wallet
2. **Withdraw stablecoins → Get fiat**: Users withdraw USDC/USDT and receive KES in their M-Pesa

## Supported Currencies

### Fiat Currencies

- 🇰🇪 **KES** (Kenyan Shilling)
- 🇳🇬 **NGN** (Nigerian Naira)
- 🇺🇬 **UGX** (Ugandan Shilling)
- 🇹🇿 **TZS** (Tanzanian Shilling)
- 🇬🇭 **GHS** (Ghanaian Cedi)
- 🇿🇦 **ZAR** (South African Rand)

### Stablecoins

- **USDT** (Tether)
- **USDC** (USD Coin)
- **cUSDC** (Celo USD Coin)

## Setup

### 1. Get Yellow Card API Credentials

1. Visit [Yellow Card Developer Portal](https://developer.yellowcard.io)
2. Sign up for a business account
3. Request API access
4. Get your API Key and Secret

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
YELLOWCARD_API_URL=https://api.yellowcard.io/v1
YELLOWCARD_API_KEY=your_api_key_here
YELLOWCARD_SECRET=your_secret_here
```

### 3. Test the Integration

```bash
# Start the backend server
cd backend
npm start

# Test endpoints
curl http://localhost:3001/api/payments/yellowcard/currencies
```

## API Endpoints

### 1. Get Supported Currencies

```http
GET /api/payments/yellowcard/currencies
```

**Response:**

```json
{
  "fiatCurrencies": ["KES", "NGN", "UGX", "TZS", "GHS", "ZAR"],
  "stablecoins": ["USDT", "USDC", "cUSDC"]
}
```

### 2. Get Conversion Rate

```http
GET /api/payments/yellowcard/rate?fiatCurrency=KES&stablecoin=USDC&type=buy
```

**Parameters:**

- `fiatCurrency`: Fiat currency code (e.g., KES)
- `stablecoin`: Stablecoin code (e.g., USDC)
- `type`: "buy" (user buying crypto) or "sell" (user selling crypto)

**Response:**

```json
{
  "success": true,
  "fiatCurrency": "KES",
  "stablecoin": "USDC",
  "type": "buy",
  "rate": 129.5,
  "timestamp": "2025-12-17T19:30:00.000Z",
  "source": "YellowCard"
}
```

### 3. Deposit Fiat → Get Stablecoins

```http
POST /api/payments/deposit/fiat-to-stablecoin
Content-Type: application/json

{
  "userId": "user_id_here",
  "fiatAmount": 1000,
  "fiatCurrency": "KES",
  "stablecoin": "USDC",
  "phone": "0712345678",
  "paymentMethod": "mpesa"
}
```

**Response:**

```json
{
  "success": true,
  "transactionId": "trans_123456",
  "message": "Deposit initiated. Please complete M-Pesa payment on your phone.",
  "fiatAmount": 1000,
  "fiatCurrency": "KES",
  "stablecoinAmount": 7.72,
  "stablecoin": "USDC",
  "conversionRate": 129.5,
  "conversionSource": "YellowCard"
}
```

**Flow:**

1. User initiates deposit of 1000 KES
2. System fetches Yellow Card rate (1 USDC = 129.50 KES)
3. Calculates stablecoin amount: 1000 / 129.50 = 7.72 USDC
4. Creates pending transaction
5. User completes M-Pesa payment
6. M-Pesa callback confirms payment
7. System credits 7.72 USDC to user's wallet

### 4. Withdraw Stablecoins → Get Fiat

```http
POST /api/payments/withdraw/stablecoin-to-fiat
Content-Type: application/json

{
  "userId": "user_id_here",
  "stablecoinAmount": 10,
  "stablecoin": "USDC",
  "fiatCurrency": "KES",
  "phone": "0712345678",
  "paymentMethod": "mpesa"
}
```

**Response:**

```json
{
  "success": true,
  "transactionId": "trans_789012",
  "message": "Withdrawal successful. 1312.00 KES sent to M-Pesa 0712345678",
  "stablecoinAmount": 10,
  "stablecoin": "USDC",
  "fiatAmount": 1312.0,
  "fiatCurrency": "KES",
  "conversionRate": 131.2,
  "conversionSource": "YellowCard"
}
```

**Flow:**

1. User initiates withdrawal of 10 USDC
2. System fetches Yellow Card sell rate (1 USDC = 131.20 KES)
3. Calculates fiat amount: 10 × 131.20 = 1312 KES
4. Deducts 10 USDC from user's wallet
5. Sends 1312 KES to user's M-Pesa

## Buy vs Sell Rates

Yellow Card provides different rates for buying and selling:

- **Buy Rate**: Used when user deposits fiat → gets crypto (higher rate)
- **Sell Rate**: Used when user withdraws crypto → gets fiat (lower rate)

Example:

```json
{
  "KES": {
    "USDC": {
      "buy": 129.5, // User pays 129.50 KES to get 1 USDC
      "sell": 131.2 // User gets 131.20 KES when selling 1 USDC
    }
  }
}
```

The spread (difference between buy and sell) is Yellow Card's fee.

## Transaction Metadata

All transactions include detailed conversion metadata:

```json
{
  "metadata": {
    "fiatAmount": 1000,
    "fiatCurrency": "KES",
    "stablecoin": "USDC",
    "conversionRate": 129.5,
    "conversionSource": "YellowCard",
    "conversionTimestamp": "2025-12-17T19:30:00.000Z"
  }
}
```

This allows you to:

- Track exact conversion rates used
- Audit transactions
- Display rate history to users
- Calculate fees and spreads

## Error Handling

The system includes comprehensive error handling:

1. **API Failure**: Falls back to cached rates
2. **Network Issues**: Retries with exponential backoff
3. **Invalid Currency**: Returns clear error messages
4. **Insufficient Balance**: Checks before processing

Example error response:

```json
{
  "error": "Insufficient balance",
  "details": {
    "required": 10,
    "available": 5,
    "currency": "USDC"
  }
}
```

## Frontend Integration Example

```typescript
// Get conversion rate
const getRateResponse = await fetch(
  "/api/payments/yellowcard/rate?fiatCurrency=KES&stablecoin=USDC&type=buy"
);
const rateData = await getRateResponse.json();
console.log(`1 USDC = ${rateData.rate} KES`);

// Deposit fiat → get stablecoins
const depositResponse = await fetch(
  "/api/payments/deposit/fiat-to-stablecoin",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: localStorage.getItem("userId"),
      fiatAmount: 1000,
      fiatCurrency: "KES",
      stablecoin: "USDC",
      phone: "0712345678",
    }),
  }
);
const depositData = await depositResponse.json();
console.log(`You will receive ${depositData.stablecoinAmount} USDC`);

// Withdraw stablecoins → get fiat
const withdrawResponse = await fetch(
  "/api/payments/withdraw/stablecoin-to-fiat",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: localStorage.getItem("userId"),
      stablecoinAmount: 10,
      stablecoin: "USDC",
      fiatCurrency: "KES",
      phone: "0712345678",
    }),
  }
);
const withdrawData = await withdrawResponse.json();
console.log(`You will receive ${withdrawData.fiatAmount} KES`);
```

## Testing

### Test with Mock Data

When `YELLOWCARD_API_KEY` is not set, the system uses fallback rates:

```javascript
{
  KES: {
    USDT: { buy: 129.50, sell: 131.20 },
    USDC: { buy: 129.45, sell: 131.15 },
    cUSDC: { buy: 129.40, sell: 131.10 }
  }
}
```

### Test Scenarios

1. **Successful Deposit**:

   - Deposit 1000 KES → Get ~7.72 USDC
   - Complete M-Pesa payment
   - Check wallet balance updated

2. **Successful Withdrawal**:

   - Withdraw 10 USDC → Get ~1312 KES
   - Check M-Pesa receives funds
   - Check wallet balance reduced

3. **Insufficient Balance**:

   - Try to withdraw more than wallet balance
   - Expect error message

4. **Invalid Currency**:
   - Try unsupported currency pair
   - Expect error message

## Production Checklist

Before going live:

- [ ] Get Yellow Card API credentials
- [ ] Add credentials to production `.env`
- [ ] Test with real Yellow Card sandbox
- [ ] Verify conversion rates are accurate
- [ ] Test M-Pesa payment flow end-to-end
- [ ] Monitor transaction logs
- [ ] Set up error alerts
- [ ] Document user flow
- [ ] Train support team

## Support

- **Yellow Card Docs**: https://docs.yellowcard.io
- **Yellow Card Support**: support@yellowcard.io
- **API Status**: https://status.yellowcard.io

## Security Notes

1. **Never expose API keys** in frontend code
2. **Validate all user inputs** on backend
3. **Log all transactions** for audit trail
4. **Monitor conversion rates** for anomalies
5. **Implement rate limiting** to prevent abuse
6. **Use HTTPS** for all API calls
7. **Verify M-Pesa callbacks** with signature validation

## Rate Limits

Yellow Card API limits (check current limits in their docs):

- Production: 100 requests/minute
- Sandbox: 50 requests/minute

Implement caching to minimize API calls:

```javascript
// Cache rates for 60 seconds
const RATE_CACHE_TTL = 60000;
```

## Future Enhancements

- [ ] Add support for more stablecoins (DAI, TUSD)
- [ ] Implement batch conversions
- [ ] Add rate history charts
- [ ] Support direct crypto transfers
- [ ] Add fee breakdown display
- [ ] Implement slippage protection
- [ ] Add rate alerts for users
- [ ] Support recurring deposits
