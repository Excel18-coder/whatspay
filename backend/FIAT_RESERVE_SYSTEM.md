# Fiat Reserve System - Implementation Guide

## Overview

The **Fiat Reserve System** tracks the actual fiat currency (KES, NGN, etc.) held in your M-Pesa till number. When users deposit fiat and convert to stablecoins, the system:

1. **Adds fiat** to reserve when M-Pesa payment is received
2. **Deducts fiat** from reserve when converting to stablecoins
3. **Tracks all movements** with complete audit trail
4. **Monitors balance** and alerts on low reserves

## How It Works

### Complete Flow:

```
┌─────────────────────────────────────────────────────────┐
│ 1. User deposits 1000 KES via M-Pesa                    │
│    → M-Pesa till receives 1000 KES                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. M-Pesa callback confirms payment                     │
│    → System adds 1000 KES to Fiat Reserve               │
│    → Reserve Balance: 50,000 → 51,000 KES               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. System converts to stablecoins                       │
│    → Fetch real-time rate: 1 USDC = 129.50 KES          │
│    → Calculate: 1000 ÷ 129.50 = 7.72 USDC               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. System deducts fiat from reserve                     │
│    → Reserve Balance: 51,000 → 50,000 KES               │
│    → Marks 1000 KES as "converted"                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. System mints stablecoins to user                     │
│    → User receives: 7.72 USDC in wallet                 │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### FiatReserve Collection

```javascript
{
  _id: ObjectId,
  currency: "KES",              // Currency code
  balance: 50000,               // Current fiat in reserve
  totalDeposited: 150000,       // Lifetime deposits received
  totalConverted: 100000,       // Lifetime fiat converted to crypto
  totalWithdrawn: 0,            // Lifetime withdrawals sent out
  lastActivity: Date,           // Last reserve movement
  lowBalanceThreshold: 10000,   // Alert when below this
  createdAt: Date,
  updatedAt: Date
}
```

### ReserveTransaction Collection (Audit Trail)

```javascript
{
  _id: ObjectId,
  currency: "KES",
  type: "conversion",           // deposit | conversion | withdrawal | adjustment
  amount: -1000,                // Negative for deductions
  balanceBefore: 51000,
  balanceAfter: 50000,
  relatedUserId: ObjectId,
  relatedTransactionId: ObjectId,
  description: "Converted 1000 KES → 7.72 USDC",
  metadata: {
    stablecoin: "USDC",
    stablecoinAmount: 7.72,
    conversionRate: 129.50,
    conversionSource: "YellowCard-Live"
  },
  createdAt: Date
}
```

## Transaction Types

### 1. Deposit

```javascript
// M-Pesa payment received
{
  type: 'deposit',
  amount: +1000,  // Positive
  description: "M-Pesa deposit received: RKL4PM8NQ2"
}
```

### 2. Conversion

```javascript
// Fiat converted to stablecoins
{
  type: 'conversion',
  amount: -1000,  // Negative (deduction)
  description: "Converted 1000 KES → 7.72 USDC"
}
```

### 3. Withdrawal

```javascript
// Fiat sent out to user
{
  type: 'withdrawal',
  amount: -500,  // Negative
  description: "M-Pesa withdrawal to 0712345678"
}
```

### 4. Adjustment

```javascript
// Manual adjustment by admin
{
  type: 'adjustment',
  amount: +10000,
  description: "Manual reserve top-up"
}
```

## API Endpoints

### 1. Get Reserve Status

```bash
# Get all reserves
GET /api/payments/reserve/status

# Get specific currency
GET /api/payments/reserve/status?currency=KES
```

**Response:**

```json
{
  "_id": "...",
  "currency": "KES",
  "balance": 50000,
  "totalDeposited": 150000,
  "totalConverted": 100000,
  "totalWithdrawn": 0,
  "lastActivity": "2025-12-17T20:30:00.000Z",
  "lowBalanceThreshold": 10000
}
```

### 2. Get Reserve Transaction History

```bash
# Get all transactions
GET /api/payments/reserve/transactions?limit=50

# Filter by currency
GET /api/payments/reserve/transactions?currency=KES&limit=100

# Filter by type
GET /api/payments/reserve/transactions?type=conversion&limit=20
```

**Response:**

```json
[
  {
    "_id": "...",
    "currency": "KES",
    "type": "conversion",
    "amount": -1000,
    "balanceBefore": 51000,
    "balanceAfter": 50000,
    "relatedUserId": {
      "name": "John Doe",
      "phone": "0712345678"
    },
    "description": "Converted 1000 KES → 7.72 USDC",
    "metadata": {
      "stablecoin": "USDC",
      "stablecoinAmount": 7.72,
      "conversionRate": 129.5
    },
    "createdAt": "2025-12-17T20:30:00.000Z"
  }
]
```

### 3. Initialize Reserve (Setup)

```bash
POST /api/payments/reserve/initialize
Content-Type: application/json

{
  "currency": "KES",
  "initialBalance": 0,
  "lowBalanceThreshold": 10000
}
```

## Setup Instructions

### 1. Initialize Reserves

Run the initialization script:

```bash
cd backend
node init-reserves.js
```

This creates reserves for:

- KES (threshold: 10,000)
- NGN (threshold: 50,000)
- UGX (threshold: 1,000,000)
- TZS (threshold: 500,000)

### 2. Verify Setup

Check reserve status:

```bash
curl http://localhost:3001/api/payments/reserve/status
```

### 3. Monitor Reserves

View transaction history:

```bash
curl "http://localhost:3001/api/payments/reserve/transactions?currency=KES"
```

## Reserve Management

### Daily Operations

1. **Morning Check**: Review reserve balances

   ```bash
   curl http://localhost:3001/api/payments/reserve/status
   ```

2. **Monitor Conversions**: Track fiat→crypto conversions

   ```bash
   curl "http://localhost:3001/api/payments/reserve/transactions?type=conversion&limit=100"
   ```

3. **Low Balance Alerts**: System logs warnings when balance < threshold
   ```
   ⚠️ LOW RESERVE ALERT: KES reserve is 8500, below threshold 10000
   ```

### Reserve Top-Up

If reserve runs low, you can:

1. **Let it auto-replenish**: New M-Pesa deposits will increase balance

2. **Manual adjustment** (if needed):
   ```bash
   POST /api/payments/reserve/initialize
   {
     "currency": "KES",
     "initialBalance": 50000
   }
   ```

## Monitoring & Alerts

### Key Metrics to Track

1. **Balance**: Current fiat in reserve
2. **Conversion Rate**: totalConverted / totalDeposited
3. **Reserve Utilization**: balance / totalDeposited
4. **Low Balance Alerts**: Frequency of threshold breaches

### Example Console Logs

```bash
# When M-Pesa payment received:
💵 Fiat Reserve: +1000 KES | Balance: 51000 KES

# When converting to stablecoins:
🔄 Conversion: -1000 KES | Reserve Balance: 50000 KES
💰 Minting 7.72 USDC (Rate: 129.50)
✅ Wallet updated: +7.72 USDC

# Low balance warning:
⚠️ LOW RESERVE ALERT: KES reserve is 8500, below threshold 10000
```

## Accounting & Reconciliation

### Daily Reconciliation

```javascript
// Check reserve balances match expectations
const reserve = await FiatReserve.findOne({ currency: "KES" });

console.log({
  balance: reserve.balance,
  totalIn: reserve.totalDeposited,
  totalOut: reserve.totalConverted + reserve.totalWithdrawn,
  calculated:
    reserve.totalDeposited - reserve.totalConverted - reserve.totalWithdrawn,
  match:
    reserve.balance ===
    reserve.totalDeposited - reserve.totalConverted - reserve.totalWithdrawn,
});
```

Expected: `balance === totalDeposited - totalConverted - totalWithdrawn`

### Audit Trail

Every reserve movement is logged:

```javascript
const transactions = await ReserveTransaction.find({ currency: "KES" }).sort({
  createdAt: -1,
});

// Calculate balance from transactions
let calculatedBalance = 0;
transactions.reverse().forEach((tx) => {
  calculatedBalance += tx.amount;
});

console.log("Reserve Balance:", reserve.balance);
console.log("Calculated from Transactions:", calculatedBalance);
// Should match!
```

## Security Best Practices

1. **Access Control**: Restrict reserve endpoints to admin users only
2. **Audit Logs**: Review reserve transactions daily
3. **Balance Alerts**: Set up monitoring for low balances
4. **Reconciliation**: Daily comparison of expected vs actual balances
5. **Backup Data**: Regular MongoDB backups of FiatReserve and ReserveTransaction collections

## Troubleshooting

### Issue: Reserve Balance Mismatch

```javascript
// Run reconciliation
const reserve = await FiatReserve.findOne({ currency: "KES" });
const transactions = await ReserveTransaction.find({ currency: "KES" });

const calculatedBalance = transactions.reduce((sum, tx) => sum + tx.amount, 0);

if (calculatedBalance !== reserve.balance) {
  console.error("⚠️ Balance mismatch detected!");
  console.log("Reserve shows:", reserve.balance);
  console.log("Transactions show:", calculatedBalance);
  console.log("Difference:", Math.abs(reserve.balance - calculatedBalance));
}
```

### Issue: Low Reserve Balance

```javascript
// Check why balance is low
const recentConversions = await ReserveTransaction.find({
  currency: "KES",
  type: "conversion",
  createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
});

const totalConverted24h = recentConversions.reduce(
  (sum, tx) => sum + Math.abs(tx.amount),
  0
);

console.log("Converted in last 24h:", totalConverted24h);
```

## Future Enhancements

- [ ] Automated reserve rebalancing
- [ ] Multi-currency reserve optimization
- [ ] Reserve utilization analytics dashboard
- [ ] Automated alerts (email/SMS) for low balances
- [ ] Reserve forecasting based on historical data
- [ ] Integration with accounting systems

---

**Status**: ✅ Production Ready

The fiat reserve system is fully operational and tracks all fiat movements with complete audit trails.
