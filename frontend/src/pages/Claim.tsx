import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import api from "@/services/api";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Gift,
  Shield,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

export default function Claim() {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<
    "loading" | "claim" | "register" | "success" | "error"
  >("loading");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [claimData, setClaimData] = useState<any>(null);
  const [error, setError] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (!claimId) {
      setError("Invalid claim link");
      setStep("error");
      return;
    }

    // Fetch claim details
    api.claim
      .getClaim(claimId)
      .then((data: any) => {
        setClaimData(data);
        setStep("claim");
      })
      .catch((err: any) => {
        setError(err.message || "Claim not found or expired");
        setStep("error");
      });
  }, [claimId]);

  const handleClaimMoney = async () => {
    if (!phone || !name || !claimId) return;

    setIsClaiming(true);
    try {
      const response: any = await api.claim.claimMoney(claimId, {
        phone,
        name,
      });
      setClaimData(response);
      setStep("success");
    } catch (err: any) {
      alert(err.message || "Failed to claim money");
    } finally {
      setIsClaiming(false);
    }
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading claim...</p>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 max-w-md mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Claim Unavailable
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link to="/dashboard">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {step === "claim" && (
            <motion.div
              key="claim"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="flex justify-center mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-primary animate-pulse-glow">
                    <Gift className="h-10 w-10 text-primary-foreground" />
                  </div>
                </motion.div>

                <h1 className="text-2xl font-bold text-foreground">
                  You've received money!
                </h1>
                <p className="text-muted-foreground mt-2">
                  {claimData?.sender_name || "Someone"} sent you stablecoins via
                  WhatsPay
                </p>
              </div>

              <Card variant="hero" className="p-8 text-center">
                <p className="text-sm text-primary-foreground/80 mb-2">
                  Amount
                </p>
                <p className="text-5xl font-bold text-primary-foreground">
                  ${parseFloat(claimData?.amount || 0).toFixed(2)}
                </p>
                <p className="text-primary-foreground/80 mt-1">
                  {claimData?.currency || "USDC"}
                </p>
              </Card>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <Card variant="default" className="p-4 text-center">
                  <p className="text-muted-foreground">From</p>
                  <p className="font-semibold text-foreground">
                    {claimData?.sender_name || "Unknown"}
                  </p>
                </Card>
                <Card variant="default" className="p-4 text-center">
                  <p className="text-muted-foreground">Expires</p>
                  <p className="font-semibold text-warning">
                    {claimData?.expires_at
                      ? new Date(claimData.expires_at).toLocaleDateString()
                      : "Soon"}
                  </p>
                </Card>
              </div>

              <div className="space-y-3">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={() => setStep("register")}>
                  <Wallet className="h-5 w-5" />
                  Claim to Wallet
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  <Shield className="inline h-3 w-3 mr-1" />
                  Secured by WhatsPay encryption
                </p>
              </div>
            </motion.div>
          )}

          {step === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">
                  Quick Registration
                </h1>
                <p className="text-muted-foreground mt-2">
                  Enter your details to claim $
                  {parseFloat(claimData?.amount || 0).toFixed(2)}
                </p>
              </div>

              <Card variant="wallet" className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  We'll create a wallet for you instantly
                </p>
              </Card>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary">
                  <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      No app download required
                    </p>
                    <p className="text-muted-foreground">
                      Claim instantly via web
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary">
                  <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      Withdraw anytime
                    </p>
                    <p className="text-muted-foreground">
                      Convert to M-Pesa, bank, or send to others
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("claim")}
                  disabled={isClaiming}
                  className="flex-1">
                  Back
                </Button>
                <Button
                  variant="hero"
                  onClick={handleClaimMoney}
                  disabled={!phone || phone.length < 10 || !name || isClaiming}
                  className="flex-1">
                  {isClaiming ? "Claiming..." : "Claim Money"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="flex justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/10">
                  <Check className="h-12 w-12 text-success" />
                </div>
              </motion.div>

              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Money Claimed!
                </h1>
                <p className="text-muted-foreground mt-2">
                  $
                  {parseFloat(
                    claimData?.claim?.amount || claimData?.amount || 0
                  ).toFixed(2)}{" "}
                  {claimData?.claim?.currency || claimData?.currency || "USDC"}{" "}
                  is now in your wallet.
                </p>
              </div>

              <Card variant="default" className="p-6 text-left">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Amount Claimed
                    </span>
                    <span className="font-medium text-success">
                      $
                      {parseFloat(
                        claimData?.claim?.amount || claimData?.amount || 0
                      ).toFixed(2)}{" "}
                      USDC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From</span>
                    <span className="font-medium">
                      {claimData?.claim?.sender_name ||
                        claimData?.sender_name ||
                        "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Balance</span>
                    <span className="font-medium">
                      $
                      {parseFloat(
                        claimData?.wallet?.balance ||
                          claimData?.claim?.amount ||
                          0
                      ).toFixed(2)}{" "}
                      USDC
                    </span>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                <Link to="/dashboard" className="block">
                  <Button variant="hero" size="lg" className="w-full">
                    Go to Wallet
                  </Button>
                </Link>
                <Link to="/send" className="block">
                  <Button variant="outline" className="w-full">
                    Send to Someone Else
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
