import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/services/api";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  Smartphone,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const kenyanBanks = [
  "Equity Bank",
  "KCB Bank",
  "Cooperative Bank",
  "ABSA Bank",
  "Standard Chartered",
  "Stanbic Bank",
  "NCBA Bank",
  "I&M Bank",
  "Diamond Trust Bank",
  "Family Bank",
  "Barclays Bank",
  "CfC Stanbic Bank",
  "Prime Bank",
  "Bank of Africa",
];

export default function PaymentMethods() {
  const navigate = useNavigate();
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    branchName: "",
    swiftCode: "",
    currency: "KES",
  });
  const [cardFormData, setCardFormData] = useState({
    cardholderName: "",
    cardNumber: "",
    cardType: "visa",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    billingAddress: "",
    billingCity: "",
    billingCountry: "Kenya",
    billingPostalCode: "",
  });

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    setIsLoading(true);
    try {
      const [accounts, userCards] = await Promise.all([
        api.bankAccount.getBankAccounts(userId),
        api.card.getCards(userId),
      ]);
      setBankAccounts(Array.isArray(accounts) ? accounts : []);
      setCards(Array.isArray(userCards) ? userCards : []);
    } catch (error) {
      console.error("Failed to load payment methods:", error);
      setBankAccounts([]);
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      const accounts = await api.bankAccount.getBankAccounts(userId);
      console.log("Loaded bank accounts:", accounts);
      console.log("First account structure:", accounts[0]);
      setBankAccounts(Array.isArray(accounts) ? accounts : []);
    } catch (error) {
      console.error("Failed to load bank accounts:", error);
      setBankAccounts([]);
    }
  };

  const handleAddAccount = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    if (
      !formData.accountName ||
      !formData.accountNumber ||
      !formData.bankName
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      await api.bankAccount.addBankAccount({
        userId,
        ...formData,
        isPrimary: bankAccounts.length === 0, // First account is primary
      });

      setIsDialogOpen(false);
      setFormData({
        accountName: "",
        accountNumber: "",
        bankName: "",
        branchName: "",
        swiftCode: "",
        currency: "KES",
      });

      await loadBankAccounts();
      alert("Bank account added successfully!");
    } catch (error: any) {
      console.error("Failed to add bank account:", error);
      alert(error.message || "Failed to add bank account");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    console.log("Deleting account with ID:", accountId);
    console.log("Type of accountId:", typeof accountId);

    if (!accountId || accountId === "undefined") {
      console.error("Invalid account ID:", accountId);
      alert(
        "Error: Invalid account ID. Please refresh the page and try again."
      );
      return;
    }

    if (!confirm("Are you sure you want to delete this bank account?")) {
      return;
    }

    try {
      await api.bankAccount.deleteBankAccount(accountId);
      await loadBankAccounts();
      alert("Bank account deleted successfully!");
    } catch (error) {
      console.error("Failed to delete bank account:", error);
      alert("Failed to delete bank account");
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    try {
      await api.bankAccount.updateBankAccount(accountId, { isPrimary: true });
      await loadBankAccounts();
    } catch (error) {
      console.error("Failed to set primary account:", error);
      alert("Failed to set primary account");
    }
  };

  // Card management functions
  const handleAddCard = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    if (
      !cardFormData.cardholderName ||
      !cardFormData.cardNumber ||
      !cardFormData.expiryMonth ||
      !cardFormData.expiryYear ||
      !cardFormData.cvv
    ) {
      alert("Please fill in all required card fields");
      return;
    }

    setIsSaving(true);
    try {
      await api.card.addCard({
        userId,
        ...cardFormData,
        isPrimary: cards.length === 0,
      });

      setIsCardDialogOpen(false);
      setCardFormData({
        cardholderName: "",
        cardNumber: "",
        cardType: "visa",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
        billingAddress: "",
        billingCity: "",
        billingCountry: "Kenya",
        billingPostalCode: "",
      });

      await loadData();
      alert("Card added successfully!");
    } catch (error: any) {
      console.error("Failed to add card:", error);
      alert(error.message || "Failed to add card");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Are you sure you want to delete this card?")) {
      return;
    }

    try {
      await api.card.deleteCard(cardId);
      await loadData();
      alert("Card deleted successfully!");
    } catch (error) {
      console.error("Failed to delete card:", error);
      alert("Failed to delete card");
    }
  };

  const handleSetCardPrimary = async (cardId: string) => {
    try {
      await api.card.updateCard(cardId, { isPrimary: true });
      await loadData();
    } catch (error) {
      console.error("Failed to set primary card:", error);
      alert("Failed to set primary card");
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(" ") : cleaned;
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <main className="container py-6 max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
            className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Payment Methods
            </h1>
            <p className="text-muted-foreground">Manage your payment options</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Money</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-success" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">M-Pesa</p>
                    <p className="text-sm text-muted-foreground">
                      {localStorage.getItem("userPhone") || "+254 712 345 678"}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success inline-block">
                      Primary
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bank Accounts</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Bank Account</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Name *</Label>
                      <Input
                        id="accountName"
                        placeholder="John Doe"
                        value={formData.accountName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accountName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name *</Label>
                      <Select
                        value={formData.bankName}
                        onValueChange={(value) =>
                          setFormData({ ...formData, bankName: value })
                        }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {kenyanBanks.map((bank) => (
                            <SelectItem key={bank} value={bank}>
                              {bank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number *</Label>
                      <Input
                        id="accountNumber"
                        placeholder="1234567890"
                        value={formData.accountNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accountNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branchName">Branch Name</Label>
                      <Input
                        id="branchName"
                        placeholder="e.g., Nairobi Branch"
                        value={formData.branchName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            branchName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="swiftCode">
                        SWIFT Code (for international)
                      </Label>
                      <Input
                        id="swiftCode"
                        placeholder="e.g., EQBLKENA"
                        value={formData.swiftCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            swiftCode: e.target.value,
                          })
                        }
                      />
                    </div>
                    <Button
                      onClick={handleAddAccount}
                      disabled={isSaving}
                      className="w-full">
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Account"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : bankAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No bank accounts added yet</p>
                  <p className="text-sm mt-1">
                    Add a bank account for withdrawals
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-start justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{account.accountName}</p>
                            {account.isVerified && (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {account.bankName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {account.accountNumber}
                          </p>
                          {account.branchName && (
                            <p className="text-xs text-muted-foreground">
                              {account.branchName}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {account.isPrimary ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary inline-block">
                                Primary
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSetPrimary(account.id)}
                                className="h-6 text-xs px-2">
                                <Star className="h-3 w-3 mr-1" />
                                Set as Primary
                              </Button>
                            )}
                            {!account.isVerified && (
                              <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning inline-block">
                                Pending Verification
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          console.log(
                            "Delete button clicked for account:",
                            account
                          );
                          console.log("Account ID being passed:", account.id);
                          handleDeleteAccount(account.id);
                        }}
                        className="text-destructive hover:text-destructive shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Credit/Debit Cards</CardTitle>
              <Dialog
                open={isCardDialogOpen}
                onOpenChange={setIsCardDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Card</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardholderName">Cardholder Name *</Label>
                      <Input
                        id="cardholderName"
                        placeholder="John Doe"
                        value={cardFormData.cardholderName}
                        onChange={(e) =>
                          setCardFormData({
                            ...cardFormData,
                            cardholderName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number *</Label>
                      <Input
                        id="cardNumber"
                        placeholder="4111 1111 1111 1111"
                        maxLength={19}
                        value={cardFormData.cardNumber}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          setCardFormData({
                            ...cardFormData,
                            cardNumber: formatted,
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardType">Card Type *</Label>
                      <Select
                        value={cardFormData.cardType}
                        onValueChange={(value) =>
                          setCardFormData({ ...cardFormData, cardType: value })
                        }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visa">Visa</SelectItem>
                          <SelectItem value="mastercard">Mastercard</SelectItem>
                          <SelectItem value="amex">American Express</SelectItem>
                          <SelectItem value="discover">Discover</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryMonth">Month *</Label>
                        <Input
                          id="expiryMonth"
                          placeholder="MM"
                          maxLength={2}
                          value={cardFormData.expiryMonth}
                          onChange={(e) =>
                            setCardFormData({
                              ...cardFormData,
                              expiryMonth: e.target.value.replace(/\D/g, ""),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiryYear">Year *</Label>
                        <Input
                          id="expiryYear"
                          placeholder="YY"
                          maxLength={2}
                          value={cardFormData.expiryYear}
                          onChange={(e) =>
                            setCardFormData({
                              ...cardFormData,
                              expiryYear: e.target.value.replace(/\D/g, ""),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input
                          id="cvv"
                          type="password"
                          placeholder="123"
                          maxLength={4}
                          value={cardFormData.cvv}
                          onChange={(e) =>
                            setCardFormData({
                              ...cardFormData,
                              cvv: e.target.value.replace(/\D/g, ""),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress">Billing Address</Label>
                      <Input
                        id="billingAddress"
                        placeholder="123 Main St"
                        value={cardFormData.billingAddress}
                        onChange={(e) =>
                          setCardFormData({
                            ...cardFormData,
                            billingAddress: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billingCity">City</Label>
                        <Input
                          id="billingCity"
                          placeholder="Nairobi"
                          value={cardFormData.billingCity}
                          onChange={(e) =>
                            setCardFormData({
                              ...cardFormData,
                              billingCity: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingPostalCode">Postal Code</Label>
                        <Input
                          id="billingPostalCode"
                          placeholder="00100"
                          value={cardFormData.billingPostalCode}
                          onChange={(e) =>
                            setCardFormData({
                              ...cardFormData,
                              billingPostalCode: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleAddCard}
                      disabled={isSaving}
                      className="w-full">
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Card"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : cards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No cards added yet</p>
                  <p className="text-sm mt-1">Add a card for quick deposits</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map((card: any) => (
                    <div
                      key={card.id}
                      className="flex items-start justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-accent" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{card.cardholderName}</p>
                            {card.isVerified && (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">
                            {card.cardType} {card.cardNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires {card.expiryMonth}/{card.expiryYear}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {card.isPrimary ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent inline-block">
                                Primary
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSetCardPrimary(card.id)}
                                className="h-6 text-xs px-2">
                                <Star className="h-3 w-3 mr-1" />
                                Set as Primary
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-destructive hover:text-destructive shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
