import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  HelpCircle,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: User, label: "Personal Information", path: "/profile/personal" },
  {
    icon: Shield,
    label: "Security & PIN",
    path: "/profile/security",
    badge: "Enabled",
  },
  { icon: CreditCard, label: "Payment Methods", path: "/profile/payments" },
  { icon: Bell, label: "Notifications", path: "/profile/notifications" },
  { icon: HelpCircle, label: "Help & Support", path: "/profile/support" },
];

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(() => {
    const cached = sessionStorage.getItem("cachedUserProfile");
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    let isMounted = true;

    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const userData = await api.user.getUser(userId);
        if (isMounted && userData) {
          setUser(userData);
          sessionStorage.setItem("cachedUserProfile", JSON.stringify(userData));
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        if (isMounted) {
          setError("Failed to load profile. Using cached data.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const kycStatus = user?.kycStatus || "unverified";
  const userName = user?.name || localStorage.getItem("userName") || "User";
  const userPhone =
    user?.phone || localStorage.getItem("userPhone") || "+254 712 345 678";
  const userAvatar =
    user?.avatar ||
    userName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();

  const handleSignOut = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhone");
    sessionStorage.clear(); // Clear all cached data
    navigate("/login");
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Header />
        <main className="container py-6 max-w-lg mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <main className="container py-6 max-w-lg mx-auto space-y-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-warning/10 border border-warning text-warning px-4 py-3 rounded-lg text-sm">
            {error}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              {user?.profilePicture && user.profilePicture.trim() !== "" ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover border-4 border-primary/20 bg-muted"
                  onError={(e) => {
                    console.error("Failed to load profile picture");
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget
                      .nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
              ) : null}
              {(!user?.profilePicture || user.profilePicture.trim() === "") && (
                <div className="flex h-24 w-24 items-center justify-center rounded-full gradient-primary text-primary-foreground text-3xl font-bold">
                  {userAvatar}
                </div>
              )}
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background",
                  kycStatus === "verified"
                    ? "bg-success"
                    : kycStatus === "pending"
                    ? "bg-warning"
                    : "bg-muted"
                )}>
                {kycStatus === "verified" ? (
                  <CheckCircle2 className="h-4 w-4 text-success-foreground" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-warning-foreground" />
                )}
              </div>
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground">{userName}</h1>
          <p className="text-muted-foreground">{userPhone}</p>
          <div
            onClick={() => kycStatus !== "verified" && navigate("/profile/kyc")}
            className={cn(
              "inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-medium transition-all",
              kycStatus === "verified"
                ? "bg-success/10 text-success"
                : kycStatus === "pending"
                ? "bg-warning/10 text-warning cursor-pointer hover:bg-warning/20"
                : "bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80"
            )}>
            {kycStatus === "verified" ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                KYC Verified
              </>
            ) : kycStatus === "pending" ? (
              <>
                <AlertCircle className="h-3 w-3" />
                KYC Pending
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                Complete KYC
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>
          <Card variant="default">
            <CardContent className="p-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    onClick={() => navigate(item.path)}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary cursor-pointer transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <span className="flex-1 font-medium text-foreground">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}>
          <Card variant="default">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Account Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      Daily Send Limit
                    </span>
                    <span className="font-medium text-foreground">
                      $500 / $1,000
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full w-1/2 gradient-primary rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      Monthly Deposit
                    </span>
                    <span className="font-medium text-foreground">
                      $2,500 / $10,000
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full w-1/4 gradient-primary rounded-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}>
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground">
          WhatsPay v1.0.0 • Terms • Privacy
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
