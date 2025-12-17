// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// User API
export const userAPI = {
  async getCurrentUser() {
    return apiFetch("/users/me");
  },

  async getUser(userId: string) {
    return apiFetch(`/users/${userId}`);
  },

  async register(data: { name: string; phone: string; avatar?: string }) {
    return apiFetch("/users/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getByPhone(phone: string) {
    return apiFetch(`/users/phone/${encodeURIComponent(phone)}`);
  },

  async updateProfile(userId: string, updates: Partial<any>) {
    return apiFetch(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async getLimits(userId: string) {
    return apiFetch(`/users/${userId}/limits`);
  },
};

// Wallet API
export const walletAPI = {
  async getWallet(userId: string) {
    return apiFetch(`/wallets/${userId}`);
  },

  async deposit(userId: string, amount: number, currency = "USDC") {
    return apiFetch(`/wallets/${userId}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amount, currency }),
    });
  },

  async withdraw(userId: string, amount: number, currency = "USDC", fee = 0.5) {
    return apiFetch(`/wallets/${userId}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ amount, currency, fee }),
    });
  },

  async convert(
    userId: string,
    fromCurrency: string,
    toCurrency: string,
    amount: number
  ) {
    return apiFetch(`/wallets/${userId}/convert`, {
      method: "POST",
      body: JSON.stringify({ fromCurrency, toCurrency, amount }),
    });
  },
};

// Transaction API
export const transactionAPI = {
  async getTransactions(
    userId: string,
    filters?: { type?: string; status?: string; limit?: number }
  ) {
    const params = new URLSearchParams({ userId, ...(filters as any) });
    return apiFetch(`/transactions?${params}`);
  },

  async getTransaction(txId: string) {
    return apiFetch(`/transactions/${txId}`);
  },

  async send(data: {
    userId: string;
    recipient: string;
    amount: number;
    currency?: string;
    fee?: number;
  }) {
    return apiFetch("/transactions/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateStatus(txId: string, status: "pending" | "completed" | "failed") {
    return apiFetch(`/transactions/${txId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

// Claim API
export const claimAPI = {
  async createClaim(data: {
    userId: string;
    amount: number;
    currency?: string;
    recipientPhone?: string;
  }) {
    return apiFetch("/claims/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getClaim(claimId: string) {
    return apiFetch(`/claims/${claimId}`);
  },

  async claimMoney(claimId: string, data: { phone: string; name: string }) {
    return apiFetch(`/claims/${claimId}/claim`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async cancelClaim(claimId: string, userId: string) {
    return apiFetch(`/claims/${claimId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },
};

// Contact API
export const contactAPI = {
  async getContacts(userId: string) {
    return apiFetch(`/contacts?userId=${userId}`);
  },

  async addContact(data: {
    userId: string;
    name: string;
    phone: string;
    avatar?: string;
  }) {
    return apiFetch("/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async searchContacts(userId: string, query: string) {
    return apiFetch(
      `/contacts/search?userId=${userId}&query=${encodeURIComponent(query)}`
    );
  },
};

// Exchange API
export const exchangeAPI = {
  async getRates() {
    return apiFetch("/exchange/rates");
  },

  async getRate(currency: string) {
    return apiFetch(`/exchange/rates/${currency}`);
  },

  async convert(from: string, to: string, amount: number) {
    return apiFetch("/exchange/convert", {
      method: "POST",
      body: JSON.stringify({ from, to, amount }),
    });
  },
};

// Bank Account API
export const bankAccountAPI = {
  async getBankAccounts(userId: string) {
    return apiFetch(`/bank-accounts?userId=${userId}`);
  },

  async getBankAccount(accountId: string) {
    return apiFetch(`/bank-accounts/${accountId}`);
  },

  async addBankAccount(data: {
    userId: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode?: string;
    branchName?: string;
    branchCode?: string;
    swiftCode?: string;
    currency?: string;
    isPrimary?: boolean;
  }) {
    return apiFetch("/bank-accounts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateBankAccount(accountId: string, data: Partial<any>) {
    return apiFetch(`/bank-accounts/${accountId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteBankAccount(accountId: string) {
    return apiFetch(`/bank-accounts/${accountId}`, {
      method: "DELETE",
    });
  },

  async withdrawToBankAccount(
    accountId: string,
    data: {
      userId: string;
      amount: number;
      currency?: string;
    }
  ) {
    return apiFetch(`/bank-accounts/${accountId}/withdraw`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Card API
export const cardAPI = {
  async getCards(userId: string) {
    return apiFetch(`/cards?userId=${userId}`);
  },

  async getCard(cardId: string) {
    return apiFetch(`/cards/${cardId}`);
  },

  async addCard(data: {
    userId: string;
    cardholderName: string;
    cardNumber: string;
    cardType: string;
    expiryMonth: string;
    expiryYear: string;
    cvv?: string;
    billingAddress?: string;
    billingCity?: string;
    billingCountry?: string;
    billingPostalCode?: string;
    isPrimary?: boolean;
  }) {
    return apiFetch("/cards", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateCard(cardId: string, data: Partial<any>) {
    return apiFetch(`/cards/${cardId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteCard(cardId: string) {
    return apiFetch(`/cards/${cardId}`, {
      method: "DELETE",
    });
  },

  async depositWithCard(
    cardId: string,
    data: {
      userId: string;
      amount: number;
      currency?: string;
    }
  ) {
    return apiFetch(`/cards/${cardId}/deposit`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Payments API (M-Pesa)
export const paymentsAPI = {
  async withdrawToMpesa(data: {
    userId: string;
    phone: string;
    amount: number;
    currency?: string;
  }) {
    return apiFetch("/payments/withdraw", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async depositFromMpesa(data: {
    userId: string;
    phone: string;
    amount: number;
  }) {
    return apiFetch("/payments/deposit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Export combined API object
export const api = {
  user: userAPI,
  wallet: walletAPI,
  transaction: transactionAPI,
  claim: claimAPI,
  contact: contactAPI,
  exchange: exchangeAPI,
  bankAccount: bankAccountAPI,
  card: cardAPI,
  payments: paymentsAPI,
};

export default api;
