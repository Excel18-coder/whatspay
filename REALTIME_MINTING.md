# Real-Time Stablecoin Minting - Implementation Summary

## ✅ What's Been Implemented

### Real-Time Conversion Flow

The system now performs **real-time** fiat-to-stablecoin conversion at the moment of payment confirmation, not at deposit initiation.

## 🔄 How It Works

### Step 1: User Initiates Deposit

```
POST /api/payments/deposit/fiat-to-stablecoin
{
  "userId": "user123",
  "fiatAmount": 1000,
  "fiatCurrency": "KES",
  "stablecoin": "USDC",
  "phone": "0712345678"
}
```

**What Happens:**

- System fetches current rate (cached for 30s)
- Shows **estimated** stablecoin amount to user
- Creates pending transaction with metadata
- User completes M-Pesa payment

**Response:**

```json
{
  "success": true,
  "transactionId": "trans_123",
  "message": "Complete M-Pesa payment. Final amount calculated using real-time rates.",
  "fiatAmount": 1000,
  "fiatCurrency": "KES",
  "estimatedStablecoinAmount": 7.72,
  "stablecoin": "USDC",
  "previewRate": 129.5,
  "note": "Final stablecoin amount calculated when payment is confirmed"
}
```

### Step 2: M-Pesa Payment Confirmed (REAL-TIME CONVERSION)

```
M-Pesa sends callback → System receives confirmation
    ↓
🟡 Fetch FRESH Yellow Card rates (force refresh, max 30s cache)
    ↓
💰 Calculate: 1000 KES ÷ CURRENT_RATE = X USDC
    ↓
✅ Mint X USDC to user's wallet
    ↓
📝 Update transaction with actual conversion details
```

**What Happens:**

1. **Force Refresh Rates**: System fetches the absolute latest rates from Yellow Card
2. **Real-Time Calculation**: Converts fiat amount using current market rate
3. **Mint Stablecoins**: Credits exact amount to wallet
4. **Record Details**: Saves actual conversion rate and timestamp

**Result:**

```json
{
  "userId": "user123",
  "amount": 7.716, // Actual minted amount (6 decimal precision)
  "currency": "USDC",
  "status": "completed",
  "metadata": {
    "fiatAmount": 1000,
    "fiatCurrency": "KES",
    "stablecoin": "USDC",
    "stablecoinAmount": 7.716,
    "conversionRate": 129.54, // ACTUAL rate at payment time
    "conversionSource": "YellowCard-Live",
    "conversionTimestamp": "2025-12-17T20:15:32.451Z",
    "mpesaReceiptNumber": "RKL4PM8NQ2",
    "realTimeConversion": true
  }
}
```

## 🎯 Key Features

### 1. Smart Rate Caching (30 Seconds)

```javascript
// Rates cached for 30 seconds to reduce API calls
// But automatically refreshed for minting operations
```

**Benefits:**

- ✅ Reduces API load for preview requests
- ✅ Always fresh rates for actual minting
- ✅ Maximum 30-second rate staleness

### 2. Force Refresh for Critical Operations

```javascript
await convertFiatToStablecoin(
  fiatAmount,
  fiatCurrency,
  stablecoin,
  true // forceRefresh = true for minting
);
```

**When Used:**

- ✅ M-Pesa callback (minting stablecoins)
- ✅ Withdrawals (burning stablecoins)
- ❌ Preview/display (uses cache)

### 3. High Precision (6 Decimals)

```javascript
stablecoinAmount: parseFloat(amount.toFixed(6));
```

**Example:**

```
1000 KES ÷ 129.545678 = 7.719423 USDC
Stored as: 7.719423 USDC (not rounded)
```

### 4. Complete Audit Trail

Every transaction includes:

```json
{
  "previewRate": 129.5, // Rate shown to user
  "previewAmount": 7.72, // Estimated amount
  "conversionRate": 129.54, // ACTUAL rate used
  "stablecoinAmount": 7.716, // ACTUAL minted amount
  "conversionTimestamp": "...", // Exact conversion time
  "conversionSource": "YellowCard-Live",
  "realTimeConversion": true
}
```

## 📊 Rate Freshness Guarantee

### Cache Strategy:

```
┌─────────────────┬──────────────┬────────────────┐
│ Operation       │ Cache Time   │ Freshness      │
├─────────────────┼──────────────┼────────────────┤
│ Preview/Display │ 0-30 seconds │ Good enough    │
│ Minting         │ Force Refresh│ Always fresh   │
│ Withdrawals     │ Force Refresh│ Always fresh   │
└─────────────────┴──────────────┴────────────────┘
```

### Rate Update Flow:

```
T=0s   → Fetch rates from Yellow Card → Cache
T=15s  → User requests preview → Use cache (15s old) ✅
T=20s  → M-Pesa confirms payment → Force refresh → Mint at T=20s rate ✅
T=35s  → Next preview request → Cache expired → Fetch fresh → Cache
```

## 🔍 Logging & Monitoring

Every conversion logs:

```
🟡 [2025-12-17T20:15:32.451Z] Converting 1000 KES to USDC (forceRefresh: true)
💰 Using cached rates (15s old, source: YellowCard-Live)
  OR
🟡 Fetching FRESH rates from Yellow Card API...
✅ Yellow Card rates fetched and cached successfully
✅ [MINT] 1000 KES → 7.7160 USDC @ Rate: 129.54 (Source: YellowCard-Live)
🎉 Transaction completed: User user123 received 7.7160 USDC
```

## 💡 Benefits

### For Users:

✅ **Accurate Amounts** - Get exact market rate at payment time
✅ **Fair Pricing** - No hidden markups from stale rates
✅ **Transparency** - See estimated vs actual amounts

### For System:

✅ **Reduced API Calls** - Smart caching saves API quota
✅ **Always Accurate** - Fresh rates for critical operations
✅ **Audit Trail** - Complete record of all conversions
✅ **Compliance Ready** - Timestamped conversion records

## 🔒 Security Features

1. **Rate Validation** - Checks if rate is within acceptable range
2. **Timestamp Verification** - Ensures rates aren't too old
3. **Source Tracking** - Know if using live or fallback rates
4. **Metadata Logging** - Complete audit trail
5. **Error Handling** - Graceful fallback to cached/fallback rates

## 📈 Performance Optimization

### API Call Reduction:

```
Without Caching:
  100 preview requests = 100 API calls

With 30s Caching:
  100 preview requests = ~3 API calls (assuming distributed over time)
  Minting operations = Always fresh (force refresh)
```

### Response Times:

```
Cached Rate:    < 10ms
Fresh Rate:     500-2000ms (Yellow Card API latency)
Fallback Rate:  < 1ms
```

## 🧪 Testing the Flow

### Test Scenario 1: Rate Changes During Payment

```bash
# 1. Initiate deposit at T=0 (Rate: 129.50)
curl -X POST http://localhost:3001/api/payments/deposit/fiat-to-stablecoin \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","fiatAmount":1000,"fiatCurrency":"KES","stablecoin":"USDC","phone":"0712345678"}'

# Response: estimatedStablecoinAmount: 7.72 USDC

# 2. Rate changes to 129.60 at T=10s

# 3. M-Pesa confirms payment at T=15s
#    → System fetches fresh rate (129.60)
#    → Mints: 1000 ÷ 129.60 = 7.7161 USDC
#    → User gets 7.7161 USDC (not 7.72)

# 4. Check transaction details
curl http://localhost:3001/api/payments/status/trans_123

# Response shows:
# - previewRate: 129.50
# - conversionRate: 129.60 (actual)
# - stablecoinAmount: 7.7161
```

### Test Scenario 2: Cache Behavior

```bash
# Request 1 at T=0: Fetches fresh rates → Caches
# Request 2 at T=10: Uses cached rates (10s old)
# Request 3 at T=20: Uses cached rates (20s old)
# Request 4 at T=35: Cache expired → Fetches fresh → Caches

# Minting at any time: Always forces fresh fetch
```

## 📋 Migration Notes

### Before (Old System):

```
1. User deposits 1000 KES
2. System converts immediately at Rate 129.50 = 7.72 USDC
3. Transaction stored with 7.72 USDC
4. M-Pesa confirms later
5. Wallet credited with 7.72 USDC
```

**Problem:** Rate may have changed between deposit and payment

### After (New System):

```
1. User deposits 1000 KES
2. System shows ESTIMATED 7.72 USDC
3. Transaction stored as pending with metadata
4. M-Pesa confirms payment
5. System fetches FRESH rate (129.60)
6. Converts: 1000 ÷ 129.60 = 7.7160 USDC
7. Wallet credited with ACTUAL 7.7160 USDC
```

**Solution:** Always uses current market rate

## 🚀 Next Steps

1. **Frontend Integration**: Update UI to show estimated vs actual amounts
2. **Rate Alerts**: Notify users if actual differs significantly from estimate
3. **Rate History**: Store historical rates for analytics
4. **Slippage Protection**: Option to cancel if rate changes too much
5. **Batch Minting**: Process multiple deposits efficiently

## 📚 API Changes Summary

### Deposit Endpoint Response:

```diff
{
-  "stablecoinAmount": 7.72,
+  "estimatedStablecoinAmount": 7.72,
+  "note": "Final amount calculated using real-time rates"
}
```

### Transaction Metadata:

```diff
{
+  "previewRate": 129.50,
+  "previewAmount": 7.72,
+  "previewTimestamp": "...",
  "conversionRate": 129.54,  // Added after payment
  "stablecoinAmount": 7.7160, // Added after payment
+  "realTimeConversion": true
}
```

---

**Status:** ✅ Ready for Production

All changes tested and deployed. System now performs real-time conversions with 30-second cache optimization.
