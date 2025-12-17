import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const LIPIA_API_KEY = process.env.LIPIA_API_KEY;
const LIPIA_BASE_URL =
  process.env.LIPIA_BASE_URL || "https://lipia-api.kreativelabske.com/api/v2";
// Use CALLBACK_URL from env (for ngrok tunnel) or default to localhost
const CALLBACK_URL =
  process.env.CALLBACK_URL ||
  `http://localhost:${process.env.PORT || 3001}/api/payments/lipia-callback`;

/**
 * Initiate M-Pesa STK Push payment
 * @param {Object} paymentData - Payment details
 * @param {string} paymentData.phoneNumber - Customer phone number (254XXXXXXXXX or 07XXXXXXXX)
 * @param {number} paymentData.amount - Amount in KES
 * @param {string} paymentData.externalReference - Your transaction reference
 * @param {Object} paymentData.metadata - Optional metadata
 * @returns {Promise<Object>} Payment initiation response
 */
export async function initiateStkPush(paymentData) {
  try {
    const {
      phoneNumber,
      amount,
      externalReference,
      metadata = {},
    } = paymentData;

    // Validate required fields
    if (!phoneNumber || !amount || !externalReference) {
      throw new Error(
        "Missing required fields: phoneNumber, amount, externalReference"
      );
    }

    if (!LIPIA_API_KEY) {
      throw new Error(
        "LIPIA_API_KEY is not configured in environment variables"
      );
    }

    // Format phone number (ensure it's in correct format)
    const formattedPhone = formatPhoneNumber(phoneNumber);

    const requestBody = {
      phone_number: formattedPhone,
      amount: Math.round(amount), // Ensure it's an integer
      external_reference: externalReference,
      callback_url: CALLBACK_URL,
      metadata,
    };

    console.log("Initiating STK Push:", {
      ...requestBody,
      phone_number: maskPhoneNumber(formattedPhone),
    });

    const response = await axios.post(
      `${LIPIA_BASE_URL}/payments/stk-push`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${LIPIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    if (response.data && response.data.success) {
      console.log("STK Push initiated successfully:", {
        transactionRef: response.data.data?.TransactionReference,
        externalRef: externalReference,
      });

      return {
        success: true,
        transactionReference: response.data.data?.TransactionReference,
        responseCode: response.data.data?.ResponseCode,
        responseDescription: response.data.data?.ResponseDescription,
        message: response.data.message || "STK push initiated successfully",
        customerMessage: response.data.customerMessage,
      };
    } else {
      throw new Error(
        response.data?.customerMessage || "Failed to initiate STK push"
      );
    }
  } catch (error) {
    console.error("Lipia STK Push Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Extract meaningful error message
    const errorMessage =
      error.response?.data?.customerMessage ||
      error.response?.data?.message ||
      error.message ||
      "Failed to initiate payment";

    return {
      success: false,
      error: errorMessage,
      errorCode: error.response?.data?.error?.code || "PAYMENT_ERROR",
    };
  }
}

/**
 * Check payment transaction status
 * @param {string} transactionReference - Transaction reference from STK push
 * @returns {Promise<Object>} Transaction status
 */
export async function checkTransactionStatus(transactionReference) {
  try {
    if (!LIPIA_API_KEY) {
      throw new Error("LIPIA_API_KEY is not configured");
    }

    const response = await axios.get(
      `${LIPIA_BASE_URL}/payments/status/${transactionReference}`,
      {
        headers: {
          Authorization: `Bearer ${LIPIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    if (response.data && response.data.success) {
      return {
        success: true,
        status: response.data.data?.Status, // Success, Failed, Pending
        amount: response.data.data?.Amount,
        mpesaReceiptNumber: response.data.data?.MpesaReceiptNumber,
        phone: response.data.data?.Phone,
        resultCode: response.data.data?.ResultCode,
        resultDescription: response.data.data?.ResultDesc,
        externalReference: response.data.data?.ExternalReference,
        metadata: response.data.data?.Metadata,
      };
    } else {
      throw new Error("Failed to fetch transaction status");
    }
  } catch (error) {
    console.error("Lipia Status Check Error:", error.message);
    return {
      success: false,
      error: error.message || "Failed to check transaction status",
    };
  }
}

/**
 * Format phone number to accepted format
 * Accepts: 254XXXXXXXXX, +254XXXXXXXXX, 07XXXXXXXX, 01XXXXXXXX
 */
function formatPhoneNumber(phone) {
  // Remove any spaces, dashes, or other characters
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Remove leading + if present
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // If starts with 0, replace with 254
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  }

  // Ensure it starts with 254
  if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }

  return cleaned;
}

/**
 * Mask phone number for logging (show only last 4 digits)
 */
function maskPhoneNumber(phone) {
  if (phone.length <= 4) return phone;
  return "****" + phone.slice(-4);
}

/**
 * Validate callback payload from Lipia
 * @param {Object} callbackData - Webhook payload
 * @returns {Object} Validated and formatted payment data
 */
export function validateCallback(callbackData) {
  try {
    const { response, status } = callbackData;

    if (!response) {
      throw new Error("Invalid callback payload: missing response");
    }

    return {
      isValid: true,
      isSuccess: status === true && response.Status === "Success",
      amount: response.Amount,
      externalReference: response.ExternalReference,
      mpesaReceiptNumber: response.MpesaReceiptNumber || null,
      phone: response.Phone,
      resultCode: response.ResultCode,
      resultDescription: response.ResultDesc,
      metadata: response.Metadata || {},
      merchantRequestID: response.MerchantRequestID,
      checkoutRequestID: response.CheckoutRequestID,
    };
  } catch (error) {
    console.error("Callback validation error:", error.message);
    return {
      isValid: false,
      error: error.message,
    };
  }
}

export default {
  initiateStkPush,
  checkTransactionStatus,
  validateCallback,
};
