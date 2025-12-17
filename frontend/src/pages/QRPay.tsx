import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/services/api";
import { motion } from "framer-motion";
import { Check, Copy, QrCode, Scan } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function QRPay() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    // Fetch user data and wallet
    Promise.all([api.user.getUser(userId), api.wallet.getWallet(userId)])
      .then(([userData, walletData]) => {
        setUser(userData);
        setWallet(walletData);
      })
      .catch(console.error);
  }, [navigate]);

  const userPhone = user?.phone || localStorage.getItem("userPhone") || "";
  const qrData = `whatspay:${userPhone}`;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(userPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />
      <main className="container py-6 max-w-lg mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">QR Pay</h1>
          <p className="text-muted-foreground">
            Scan or share your QR code to receive payments
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>
          <Tabs defaultValue="receive" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="receive">
                <QrCode className="mr-2 h-4 w-4" />
                Receive
              </TabsTrigger>
              <TabsTrigger value="scan">
                <Scan className="mr-2 h-4 w-4" />
                Scan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="receive" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Your QR Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* QR Code Placeholder */}
                  <div className="flex justify-center">
                    <div className="p-6 bg-white rounded-2xl shadow-lg">
                      <div className="w-64 h-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                        <QrCode className="w-48 h-48 text-primary/30" />
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold">
                      {user?.name || localStorage.getItem("userName")}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-muted-foreground">{userPhone}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyPhone}
                        className="h-8 w-8 p-0">
                        {copied ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Balance Display */}
                  {wallet && (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        Your Balance
                      </p>
                      <p className="text-2xl font-bold">
                        ${wallet.balance.toFixed(2)} {wallet.currency}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ≈ KES {wallet.localBalance.toFixed(2)}
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground text-center">
                    Anyone can scan this code to send you money instantly
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scan" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Scan QR Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Camera/Scanner Placeholder */}
                  <div className="relative aspect-square bg-muted rounded-xl overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <Scan className="w-16 h-16 mx-auto text-muted-foreground animate-pulse" />
                        <p className="text-muted-foreground">
                          Camera access required
                        </p>
                      </div>
                    </div>

                    {/* Scanning frame overlay */}
                    <div className="absolute inset-8 border-2 border-primary rounded-xl">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                      Position the QR code within the frame
                    </p>
                    <Button variant="outline" className="w-full" disabled>
                      Enable Camera
                    </Button>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Or enter phone number manually
                    </p>
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => navigate("/send")}>
                      Enter Manually
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}
