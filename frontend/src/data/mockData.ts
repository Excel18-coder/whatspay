import { Transaction } from "@/components/transactions/TransactionItem";

export const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "send",
    amount: 50.00,
    currency: "USDC",
    recipient: "Sarah M.",
    status: "completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    fee: 0.10,
  },
  {
    id: "2",
    type: "receive",
    amount: 125.00,
    currency: "USDC",
    sender: "John K.",
    status: "completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "3",
    type: "deposit",
    amount: 200.00,
    currency: "USDC",
    status: "completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: "4",
    type: "send",
    amount: 75.00,
    currency: "USDC",
    recipient: "Mike O.",
    status: "pending",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    fee: 0.15,
  },
  {
    id: "5",
    type: "convert",
    amount: 500.00,
    currency: "KES",
    status: "completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "6",
    type: "receive",
    amount: 30.00,
    currency: "USDC",
    sender: "Grace W.",
    status: "completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
  {
    id: "7",
    type: "withdraw",
    amount: 100.00,
    currency: "USDC",
    status: "completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    fee: 0.50,
  },
];

export const mockContacts = [
  { id: "1", name: "Sarah M.", phone: "+254 712 345 678", avatar: "SM" },
  { id: "2", name: "John K.", phone: "+254 723 456 789", avatar: "JK" },
  { id: "3", name: "Mike O.", phone: "+254 734 567 890", avatar: "MO" },
  { id: "4", name: "Grace W.", phone: "+254 745 678 901", avatar: "GW" },
  { id: "5", name: "Peter N.", phone: "+254 756 789 012", avatar: "PN" },
];

export const mockExchangeRates = {
  KES: 129.0,
  NGN: 1550.0,
  UGX: 3750.0,
  TZS: 2500.0,
  USD: 1.0,
};
