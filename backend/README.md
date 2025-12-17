# WhatsPay Backend API

Complete REST API server for the WhatsPay stablecoin wallet application with M-Pesa integration via Lipia Online.

## 🚀 Quick Start

### Installation

```bash
cd backend
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
DATABASE_URL=your_postgresql_connection_string

# Lipia Online API (for M-Pesa deposits)
LIPIA_API_KEY=your_lipia_api_key
LIPIA_BASE_URL=https://lipia-api.kreativelabske.com/api/v2
```

**Note:** See [LIPIA_INTEGRATION.md](./LIPIA_INTEGRATION.md) for complete M-Pesa setup instructions.

### Run Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3001`

## 📡 API Endpoints

### Users

- `GET /api/users/me` - Get current user
- `GET /api/users/:userId` - Get user by ID
- `POST /api/users/register` - Register new user
- `PATCH /api/users/:userId` - Update user profile
- `GET /api/users/:userId/limits` - Get transaction limits

### Wallets

- `GET /api/wallets/:userId` - Get wallet balance
- `POST /api/wallets/:userId/deposit` - Deposit funds (supports M-Pesa via Lipia)
- `POST /api/wallets/:userId/withdraw` - Withdraw funds
- `POST /api/wallets/:userId/convert` - Convert currency

### Payments (M-Pesa Integration)

- `POST /api/payments/lipia-callback` - Webhook for M-Pesa confirmations
- `GET /api/payments/status/:transactionId` - Check payment status

### Transactions

- `GET /api/transactions?userId=xxx` - Get all transactions
- `GET /api/transactions/:txId` - Get specific transaction
- `POST /api/transactions/send` - Send money
- `PATCH /api/transactions/:txId/status` - Update status

### Claims

- `POST /api/claims/create` - Create claim link
- `GET /api/claims/:claimId` - Get claim details
- `POST /api/claims/:claimId/claim` - Claim money
- `POST /api/claims/:claimId/cancel` - Cancel claim

### Contacts

- `GET /api/contacts?userId=xxx` - Get all contacts
- `POST /api/contacts` - Add new contact
- `GET /api/contacts/search?userId=xxx&query=xxx` - Search

### Exchange

- `GET /api/exchange/rates` - Get all rates
- `GET /api/exchange/rates/:currency` - Get specific rate
- `POST /api/exchange/convert` - Convert currencies

## 🧪 Testing

```bash
# Health check
curl http://localhost:3001/health

# Get user
curl http://localhost:3001/api/users/me

# Get wallet
curl http://localhost:3001/api/wallets/user-1
```

## 📦 Tech Stack

- **Express.js** - Web framework
- **CORS** - Cross-origin support
- **UUID** - Unique ID generation
- **In-memory Store** - Data storage (temporary)

## 🔮 Future Enhancements

- [ ] PostgreSQL/MongoDB integration
- [ ] JWT authentication
- [ ] Rate limiting
- [ ] Request validation
- [ ] Unit tests
- [ ] API documentation (Swagger)

## 📝 License

MIT
