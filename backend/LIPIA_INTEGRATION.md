# Lipia Online M-Pesa Integration

This document explains how to set up and use the Lipia Online integration for M-Pesa mobile money deposits in WhatsPay.

## Overview

Lipia Online is integrated to handle M-Pesa STK Push payments, allowing users to deposit funds directly from their M-Pesa wallets into their WhatsPay USDC wallets.

## Setup Instructions

### 1. Get Your Lipia API Key

1. Visit [https://lipia-online.vercel.app](https://lipia-online.vercel.app)
2. Sign up or log in to your account
3. Create a new app in your dashboard
4. Navigate to the Security tab in your app details
5. Generate and copy your API key

### 2. Configure Environment Variables

Add your Lipia API credentials to `/backend/.env`:

```env
# Lipia Online API Configuration
LIPIA_API_KEY=your_actual_api_key_here
LIPIA_BASE_URL=https://lipia-api.kreativelabske.com/api/v2
```

### 3. Set Up Public Callback URL

For production, you need a publicly accessible callback URL. During development, you can use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start your backend server
cd backend && npm run dev

# In another terminal, expose your local server
ngrok http 3001

# Update the callback URL in backend/services/lipia.js
# Replace localhost:3001 with your ngrok URL
```

For production, use your actual domain:

```javascript
const CALLBACK_URL = `https://yourdomain.com/api/payments/lipia-callback`;
```

## How It Works

### Payment Flow

1. **User Initiates Deposit**

   - User selects M-Pesa payment method
   - Enters amount in local currency (KES)
   - Provides M-Pesa phone number

2. **STK Push Initiated**

   - Backend calls Lipia API to initiate STK push
   - Creates pending transaction in database
   - Returns transaction ID to frontend

3. **User Enters PIN**

   - User receives M-Pesa prompt on their phone
   - Enters M-Pesa PIN to authorize payment

4. **Webhook Callback**

   - Lipia sends payment confirmation to callback URL
   - Backend updates transaction status
   - Wallet balance is updated for successful payments

5. **Frontend Polling**
   - Frontend polls transaction status every 3 seconds
   - Shows success/failure message based on status

### API Endpoints

#### Initiate Deposit (M-Pesa)

```http
POST /api/wallets/:userId/deposit
Content-Type: application/json

{
  "amount": 10.0,              // USDC amount
  "currency": "USDC",
  "method": "mpesa",
  "phoneNumber": "254712345678",
  "localAmount": 1290,         // KES amount
  "localCurrency": "KES"
}
```

**Response:**

```json
{
  "success": true,
  "message": "STK push sent to your phone...",
  "transaction": {
    "id": "uuid",
    "status": "pending",
    "amount": 10.0,
    "currency": "USDC",
    "localAmount": 1290,
    "localCurrency": "KES"
  },
  "payment": {
    "transactionReference": "ref123",
    "responseDescription": "Success..."
  }
}
```

#### Check Payment Status

```http
GET /api/payments/status/:transactionId
```

**Response:**

```json
{
  "transactionId": "uuid",
  "status": "completed", // or "pending", "failed"
  "amount": 10.0,
  "currency": "USDC",
  "metadata": {
    "mpesaReceiptNumber": "NEF61H8J60",
    "phoneNumber": "254712345678"
  }
}
```

#### Webhook Callback (Internal)

```http
POST /api/payments/lipia-callback
Content-Type: application/json

{
  "response": {
    "Amount": 1290,
    "ExternalReference": "transaction-uuid",
    "MpesaReceiptNumber": "NEF61H8J60",
    "Phone": "254712345678",
    "ResultCode": 0,
    "ResultDesc": "Success...",
    "Status": "Success"
  },
  "status": true
}
```

## Testing

### Test Phone Numbers

For testing, use phone numbers registered in your Lipia dashboard with test mode enabled.

### Test Flow

1. Start the backend server:

```bash
cd backend
npm run dev
```

2. Start the frontend:

```bash
cd frontend
npm run dev
```

3. Navigate to Deposit page
4. Select M-Pesa payment method
5. Enter amount (e.g., 1000 KES)
6. Enter test phone number
7. Check your phone for STK push
8. Enter PIN to complete

## Production Checklist

- [ ] Set production Lipia API key in environment variables
- [ ] Update callback URL to production domain (HTTPS required)
- [ ] Test with real M-Pesa transactions
- [ ] Monitor webhook logs for errors
- [ ] Implement retry logic for failed webhooks
- [ ] Add email notifications for deposit confirmations
- [ ] Set up monitoring alerts for payment failures

## Security Considerations

1. **API Key Security**

   - Never commit API keys to version control
   - Use environment variables for all credentials
   - Rotate API keys periodically

2. **Callback Validation**

   - Always validate callback payload structure
   - Check transaction IDs match your records
   - Implement idempotency to prevent duplicate processing

3. **HTTPS Required**
   - Callback URLs must use HTTPS in production
   - Use valid SSL certificates

## Troubleshooting

### Callback Not Received

1. Check if callback URL is publicly accessible
2. Verify HTTPS is enabled (production)
3. Check server logs for errors
4. Test URL with tools like webhook.site

### STK Push Fails

1. Verify phone number format (254XXXXXXXXX)
2. Check API key is valid
3. Ensure amount is within M-Pesa limits
4. Review Lipia dashboard for error details

### Payment Stuck in Pending

1. Check if user completed PIN entry
2. Review webhook logs for callback delivery
3. Manually check transaction status via API
4. Contact Lipia support if issue persists

## Support

For Lipia API issues:

- Phone: 0768793923
- Email: devriz2030@gmail.com
- Documentation: https://lipia-online-docs.vercel.app

## Resources

- [Lipia Online Dashboard](https://lipia-online.vercel.app/dashboard)
- [API Documentation](https://lipia-online-docs.vercel.app)
- [Transaction Status Guide](https://lipia-online-docs.vercel.app/transaction-status)
- [Webhook Handling](https://lipia-online-docs.vercel.app/handling-callback)
