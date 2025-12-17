import { v4 as uuidv4 } from "uuid";

// In-memory database (replace with real database later)
class DataStore {
  constructor() {
    this.users = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.claims = new Map();
    this.contacts = new Map();
    this.exchangeRates = {
      KES: 129.0,
      NGN: 1550.0,
      UGX: 3750.0,
      TZS: 2500.0,
      USD: 1.0,
      USDC: 1.0,
    };
    this.initializeMockData();
  }

  initializeMockData() {
    // Create default user
    const userId = "user-1";
    this.users.set(userId, {
      id: userId,
      name: "Alex Kamau",
      phone: "+254712345678",
      avatar: "AK",
      kycStatus: "verified",
      createdAt: new Date("2024-01-15"),
      dailyLimit: 1000,
      monthlyLimit: 10000,
    });

    // Create wallet for user
    this.wallets.set(userId, {
      id: `wallet-${userId}`,
      userId,
      balance: 1250.0,
      currency: "USDC",
      localCurrency: "KES",
    });

    // Create contacts
    const contacts = [
      {
        id: "contact-1",
        userId,
        name: "Sarah M.",
        phone: "+254712345678",
        avatar: "SM",
      },
      {
        id: "contact-2",
        userId,
        name: "John K.",
        phone: "+254723456789",
        avatar: "JK",
      },
      {
        id: "contact-3",
        userId,
        name: "Mike O.",
        phone: "+254734567890",
        avatar: "MO",
      },
      {
        id: "contact-4",
        userId,
        name: "Grace W.",
        phone: "+254745678901",
        avatar: "GW",
      },
      {
        id: "contact-5",
        userId,
        name: "Peter N.",
        phone: "+254756789012",
        avatar: "PN",
      },
    ];
    contacts.forEach((contact) => this.contacts.set(contact.id, contact));

    // Create transactions
    const now = Date.now();
    const transactions = [
      {
        id: "tx-1",
        userId,
        type: "send",
        amount: 50.0,
        currency: "USDC",
        recipient: "Sarah M.",
        status: "completed",
        timestamp: new Date(now - 1000 * 60 * 30),
        fee: 0.1,
      },
      {
        id: "tx-2",
        userId,
        type: "receive",
        amount: 125.0,
        currency: "USDC",
        sender: "John K.",
        status: "completed",
        timestamp: new Date(now - 1000 * 60 * 60 * 2),
      },
      {
        id: "tx-3",
        userId,
        type: "deposit",
        amount: 200.0,
        currency: "USDC",
        status: "completed",
        timestamp: new Date(now - 1000 * 60 * 60 * 5),
      },
      {
        id: "tx-4",
        userId,
        type: "send",
        amount: 75.0,
        currency: "USDC",
        recipient: "Mike O.",
        status: "pending",
        timestamp: new Date(now - 1000 * 60 * 60 * 8),
        fee: 0.15,
      },
      {
        id: "tx-5",
        userId,
        type: "convert",
        amount: 500.0,
        currency: "KES",
        status: "completed",
        timestamp: new Date(now - 1000 * 60 * 60 * 24),
      },
      {
        id: "tx-6",
        userId,
        type: "receive",
        amount: 30.0,
        currency: "USDC",
        sender: "Grace W.",
        status: "completed",
        timestamp: new Date(now - 1000 * 60 * 60 * 48),
      },
      {
        id: "tx-7",
        userId,
        type: "withdraw",
        amount: 100.0,
        currency: "USDC",
        status: "completed",
        timestamp: new Date(now - 1000 * 60 * 60 * 72),
        fee: 0.5,
      },
    ];
    transactions.forEach((tx) => this.transactions.set(tx.id, tx));
  }

  // User methods
  getUser(userId) {
    return this.users.get(userId);
  }

  getUserByPhone(phone) {
    return Array.from(this.users.values()).find((u) => u.phone === phone);
  }

  createUser(userData) {
    const userId = uuidv4();
    const user = {
      id: userId,
      ...userData,
      createdAt: new Date(),
      kycStatus: "unverified",
      dailyLimit: 500,
      monthlyLimit: 5000,
    };
    this.users.set(userId, user);
    return user;
  }

  updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (!user) return null;
    const updated = { ...user, ...updates };
    this.users.set(userId, updated);
    return updated;
  }

  // Wallet methods
  getWallet(userId) {
    return this.wallets.get(userId);
  }

  createWallet(userId) {
    const wallet = {
      id: `wallet-${userId}`,
      userId,
      balance: 0,
      currency: "USDC",
      localCurrency: "KES",
    };
    this.wallets.set(userId, wallet);
    return wallet;
  }

  updateWalletBalance(userId, amount) {
    const wallet = this.wallets.get(userId);
    if (!wallet) return null;
    wallet.balance += amount;
    this.wallets.set(userId, wallet);
    return wallet;
  }

  // Transaction methods
  getTransactions(userId, filters = {}) {
    const userTransactions = Array.from(this.transactions.values()).filter(
      (tx) => tx.userId === userId
    );

    if (filters.type) {
      return userTransactions.filter((tx) => tx.type === filters.type);
    }

    return userTransactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  getTransaction(txId) {
    return this.transactions.get(txId);
  }

  createTransaction(txData) {
    const txId = uuidv4();
    const transaction = {
      id: txId,
      ...txData,
      timestamp: new Date(),
      status: txData.status || "pending",
    };
    this.transactions.set(txId, transaction);
    return transaction;
  }

  updateTransaction(txId, updates) {
    const tx = this.transactions.get(txId);
    if (!tx) return null;
    const updated = { ...tx, ...updates };
    this.transactions.set(txId, updated);
    return updated;
  }

  // Contact methods
  getContacts(userId) {
    return Array.from(this.contacts.values()).filter(
      (c) => c.userId === userId
    );
  }

  createContact(contactData) {
    const contactId = uuidv4();
    const contact = {
      id: contactId,
      ...contactData,
    };
    this.contacts.set(contactId, contact);
    return contact;
  }

  // Claim methods
  getClaim(claimId) {
    return this.claims.get(claimId);
  }

  createClaim(claimData) {
    const claimId = uuidv4();
    const claim = {
      id: claimId,
      ...claimData,
      status: "pending",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
    this.claims.set(claimId, claim);
    return claim;
  }

  updateClaim(claimId, updates) {
    const claim = this.claims.get(claimId);
    if (!claim) return null;
    const updated = { ...claim, ...updates };
    this.claims.set(claimId, updated);
    return updated;
  }

  // Exchange rate methods
  getExchangeRates() {
    return this.exchangeRates;
  }

  getExchangeRate(currency) {
    return this.exchangeRates[currency];
  }

  updateExchangeRate(currency, rate) {
    this.exchangeRates[currency] = rate;
    return rate;
  }
}

export default new DataStore();
