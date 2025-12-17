# Yellow Card API Integration - Quick Start

## ✅ What's Been Added

### New Files

1. **`backend/services/yellowcard.js`** - Yellow Card API service

   - Fetch real-time crypto rates
   - Convert fiat → stablecoin
   - Convert stablecoin → fiat
   - Fallback rates when API unavailable

2. **`backend/YELLOWCARD_INTEGRATION.md`** - Complete documentation

### Updated Files

1. **`backend/routes/payments.js`** - New endpoints:

   - `GET /api/payments/yellowcard/rate` - Get conversion rate
   - `GET /api/payments/yellowcard/currencies` - List supported currencies
   - `POST /api/payments/deposit/fiat-to-stablecoin` - Deposit fiat, receive crypto
   - `POST /api/payments/withdraw/stablecoin-to-fiat` - Withdraw crypto, receive fiat

2. **`backend/.env.example`** - Added Yellow Card config

## 🚀 How It Works

### Deposit Flow (Fiat → Stablecoin)

```
User deposits 1000 KES via M-Pesa
    ↓
Yellow Card API: 1 USDC = 129.50 KES
    ↓
Calculate: 1000 ÷ 129.50 = 7.72 USDC
    ↓
User receives 7.72 USDC in wallet
```

### Withdrawal Flow (Stablecoin → Fiat)

```
User withdraws 10 USDC
    ↓
Yellow Card API: 1 USDC = 131.20 KES (sell rate)
    ↓
Calculate: 10 × 131.20 = 1,312 KES
    ↓
User receives 1,312 KES in M-Pesa
```

## 🔧 Setup (3 Steps)

### 1. Get Yellow Card API Key

Visit: https://developer.yellowcard.io

### 2. Add to `.env`

```bash
YELLOWCARD_API_URL=https://api.yellowcard.io/v1
YELLOWCARD_API_KEY=your_key_here
YELLOWCARD_SECRET=your_secret_here
```

### 3. Restart Server

```bash
cd backend
npm start
```

## 💰 Supported Conversions

### Fiat Currencies

- KES (Kenyan Shilling) 🇰🇪
- NGN (Nigerian Naira) 🇳🇬
- UGX (Ugandan Shilling) 🇺🇬
- TZS (Tanzanian Shilling) 🇹🇿
- GHS (Ghanaian Cedi) 🇬🇭
- ZAR (South African Rand) 🇿🇦

### Stablecoins

- USDT (Tether)
- USDC (USD Coin)
- cUSDC (Celo USD Coin)

## 📊 Example API Calls

### Check Rate

```bash
curl "http://localhost:3001/api/payments/yellowcard/rate?fiatCurrency=KES&stablecoin=USDC&type=buy"
```

### Deposit (Fiat → Crypto)

```bash
curl -X POST http://localhost:3001/api/payments/deposit/fiat-to-stablecoin \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "fiatAmount": 1000,
    "fiatCurrency": "KES",
    "stablecoin": "USDC",
    "phone": "0712345678"
  }'
```

### Withdraw (Crypto → Fiat)

```bash
curl -X POST http://localhost:3001/api/payments/withdraw/stablecoin-to-fiat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "stablecoinAmount": 10,
    "stablecoin": "USDC",
    "fiatCurrency": "KES",
    "phone": "0712345678"
  }'
```

## 🎯 Key Features

✅ **Real-time Rates** - Always uses latest Yellow Card prices
✅ **Buy/Sell Spreads** - Different rates for deposits vs withdrawals
✅ **Fallback Support** - Works even if Yellow Card API is down
✅ **Multi-Currency** - Supports 6 African fiat currencies
✅ **3 Stablecoins** - USDT, USDC, and cUSDC
✅ **Transaction Tracking** - Full metadata for every conversion
✅ **Error Handling** - Graceful failures with clear messages

## 🔒 Security

- API keys stored in environment variables
- All conversions logged with metadata
- Rate validation before processing
- Balance checks before withdrawals
- M-Pesa callback verification

## 📖 Full Documentation

See `backend/YELLOWCARD_INTEGRATION.md` for:

- Detailed API reference
- Frontend integration examples
- Testing instructions
- Production checklist
- Security best practices

## 🆘 Support

- Yellow Card Docs: https://docs.yellowcard.io
- Yellow Card Support: support@yellowcard.io
- API Status: https://status.yellowcard.io

---

**Ready to test!** 🎉

Start your backend server and try the deposit/withdraw endpoints!
