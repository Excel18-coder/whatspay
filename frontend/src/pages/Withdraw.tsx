import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/services/api";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Withdraw() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<any>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<"mpesa" | "bank">(
    "mpesa"
  );
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("KES");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    const userPhone = localStorage.getItem("userPhone") || "";
    setMpesaPhone(userPhone);

    loadData();
  }, [navigate]);

  const loadData = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    setIsLoading(true);
    try {
      const [walletData, accounts] = await Promise.all([
        api.wallet.getWallet(userId),
        api.bankAccount.getBankAccounts(userId),
      ]);

      setWallet(walletData);
      // Only show verified accounts
      const verifiedAccounts = Array.isArray(accounts)
        ? accounts.filter((acc: any) => acc.isVerified)
        : [];
      setBankAccounts(verifiedAccounts);

      // Auto-select primary account if available
      const primaryAccount = verifiedAccounts.find((acc: any) => acc.isPrimary);
      if (primaryAccount) {
        setSelectedAccountId(primaryAccount._id);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMpesaWithdraw = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    if (!mpesaPhone) {
      alert("Please enter M-Pesa phone number");
      return;
    }

    const phoneRegex = /^(07|01)\d{8}$/;
    if (!phoneRegex.test(mpesaPhone)) {
      alert("Please enter a valid phone number (e.g., 0712345678)");
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // Minimum withdrawal for M-Pesa is KES 10
    if (currency === "KES" && withdrawAmount < 10) {
      alert("Minimum M-Pesa withdrawal is KSh 10");
      return;
    }

    // Check if sufficient balance
    if (currency === "USDT") {
      if (withdrawAmount > wallet.usdtBalance) {
        alert("Insufficient USDT balance");
        return;
      }
    } else {
      const usdtEquivalent = withdrawAmount / (wallet.kesRate || 1);
      if (usdtEquivalent > wallet.usdtBalance) {
        alert("Insufficient balance");
        return;
      }
    }

    setIsWithdrawing(true);
    try {
      await api.payments.withdrawToMpesa({
        userId,
        phone: mpesaPhone,
        amount: withdrawAmount,
        currency: currency,
      });

      alert("M-Pesa withdrawal initiated! You will receive the funds shortly.");
      navigate("/history");
    } catch (error: any) {
      console.error("M-Pesa withdrawal failed:", error);
      alert(error.message || "Withdrawal failed. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleBankWithdraw = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    if (!selectedAccountId) {
      alert("Please select a bank account");
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // Check if sufficient balance
    if (currency === "USDT") {
      if (withdrawAmount > wallet.usdtBalance) {
        alert("Insufficient USDT balance");
        return;
      }
    } else {
      const usdtEquivalent = withdrawAmount / (wallet.kesRate || 1);
      if (usdtEquivalent > wallet.usdtBalance) {
        alert("Insufficient balance");
        return;
      }
    }

    setIsWithdrawing(true);
    try {
      await api.bankAccount.withdrawToBankAccount(selectedAccountId, {
        userId,
        amount: withdrawAmount,
        currency: currency,
      });

      alert(
        "Withdrawal initiated successfully! It will be processed within 1-2 business days."
      );
      navigate("/history");
    } catch (error: any) {
      console.error("Withdrawal failed:", error);
      alert(error.message || "Withdrawal failed. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const selectedAccount = bankAccounts.find(
    (acc) => acc._id === selectedAccountId
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <main className="container py-6 max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Withdraw Funds
            </h1>
            <p className="text-muted-foreground">
              Transfer to M-Pesa or bank account
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6">
          {/* Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle>Available Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">USDT Balance</span>
                <span className="text-xl font-bold">
                  ${wallet?.usdtBalance?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">KES Equivalent</span>
                <span className="text-lg">
                  KSh {wallet?.kesBalance?.toFixed(2) || "0.00"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Methods Tabs */}
          <Tabs defaultValue="mpesa" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mpesa">
                <Smartphone className="h-4 w-4 mr-2" />
                M-Pesa
              </TabsTrigger>
              <TabsTrigger value="bank">
                <Building2 className="h-4 w-4 mr-2" />
                Bank Account
              </TabsTrigger>
            </TabsList>

            {/* M-Pesa Withdrawal */}
            <TabsContent value="mpesa" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Withdraw to M-Pesa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>M-Pesa Phone Number</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="0712345678"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter the M-Pesa number to receive funds
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">
                          KES (Kenyan Shillings)
                        </SelectItem>
                        <SelectItem value="USDT">USDT (Tether)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {currency === "USDT" ? "$" : "KSh"}
                      </span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-10"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    {amount && (
                      <p className="text-sm text-muted-foreground">
                        {currency === "USDT"
                          ? `≈ KSh ${(
                              parseFloat(amount) * (wallet?.kesRate || 1)
                            ).toFixed(2)}`
                          : `≈ $${(
                              parseFloat(amount) / (wallet?.kesRate || 1)
                            ).toFixed(2)}`}
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Transaction Fee
                      </span>
                      <span>Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Processing Time
                      </span>
                      <span>Instant</span>
                    </div>
                    {amount && (
                      <div className="flex justify-between font-medium pt-2 border-t">
                        <span>You will receive</span>
                        <span>
                          {currency === "USDT" ? "$" : "KSh"}
                          {parseFloat(amount).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleMpesaWithdraw}
                    disabled={isWithdrawing || !mpesaPhone || !amount}
                    className="w-full">
                    {isWithdrawing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Withdraw to M-Pesa"
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    You will receive an M-Pesa notification instantly
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bank Account Withdrawal */}
            <TabsContent value="bank" className="space-y-4">
              {bankAccounts.length === 0 ? (
                <Card className="border-warning">
                  <CardContent className="py-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="font-medium">No verified bank accounts</p>
                        <p className="text-sm text-muted-foreground">
                          You need to add and verify a bank account before you
                          can withdraw funds.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/profile/payments")}
                          className="mt-2">
                          Add Bank Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Withdraw To</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select Bank Account</Label>
                        <Select
                          value={selectedAccountId}
                          onValueChange={setSelectedAccountId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map((account) => (
                              <SelectItem key={account._id} value={account._id}>
                                <div className="flex items-center gap-2">
                                  {account.bankName} - {account.accountNumber}
                                  {account.isPrimary && (
                                    <span className="text-xs text-primary">
                                      (Primary)
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedAccount && (
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {selectedAccount.accountName}
                            </span>
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedAccount.bankName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Account: {selectedAccount.accountNumber}
                          </p>
                          {selectedAccount.branchName && (
                            <p className="text-xs text-muted-foreground">
                              Branch: {selectedAccount.branchName}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KES">
                              KES (Kenyan Shillings)
                            </SelectItem>
                            <SelectItem value="USDT">USDT (Tether)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {currency === "USDT" ? "$" : "KSh"}
                          </span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="pl-10"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        {amount && (
                          <p className="text-sm text-muted-foreground">
                            {currency === "USDT"
                              ? `≈ KSh ${(
                                  parseFloat(amount) * (wallet?.kesRate || 1)
                                ).toFixed(2)}`
                              : `≈ $${(
                                  parseFloat(amount) / (wallet?.kesRate || 1)
                                ).toFixed(2)}`}
                          </p>
                        )}
                      </div>

                      <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Processing Fee
                          </span>
                          <span>Free</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Processing Time
                          </span>
                          <span>1-2 business days</span>
                        </div>
                        {amount && (
                          <div className="flex justify-between font-medium pt-2 border-t">
                            <span>You will receive</span>
                            <span>
                              {currency === "USDT" ? "$" : "KSh"}
                              {parseFloat(amount).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={handleBankWithdraw}
                        disabled={
                          isWithdrawing || !selectedAccountId || !amount
                        }
                        className="w-full">
                        {isWithdrawing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Withdraw to Bank"
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Withdrawals are processed securely. Your funds will be
                        transferred to your bank account within 1-2 business
                        days.
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
