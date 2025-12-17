import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { TransactionList } from "@/components/transactions/TransactionList";
import { QuickActions } from "@/components/wallet/QuickActions";
import { WalletCard } from "@/components/wallet/WalletCard";
import api from "@/services/api";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<any>(() => {
    // Try to load from sessionStorage first
    const cached = sessionStorage.getItem("cachedWallet");
    return cached ? JSON.parse(cached) : null;
  });
  const [transactions, setTransactions] = useState<any[]>(() => {
    const cached = sessionStorage.getItem("cachedTransactions");
    return cached ? JSON.parse(cached) : [];
  });
  const [user, setUser] = useState<any>(() => {
    const cached = sessionStorage.getItem("cachedUser");
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    let isMounted = true;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [walletData, txData, userData] = await Promise.all([
          api.wallet.getWallet(userId),
          api.transaction.getTransactions(userId, { limit: 4 }),
          api.user.getCurrentUser(),
        ]);

        if (isMounted) {
          // Only update if component is still mounted
          if (walletData) {
            setWallet(walletData);
            sessionStorage.setItem("cachedWallet", JSON.stringify(walletData));
          }

          const txArray = Array.isArray(txData) ? txData : [];
          setTransactions(txArray);
          sessionStorage.setItem("cachedTransactions", JSON.stringify(txArray));

          if (userData) {
            setUser(userData);
            sessionStorage.setItem("cachedUser", JSON.stringify(userData));
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        if (isMounted) {
          setError("Failed to load dashboard. Using cached data.");
          // Keep existing cached data, don't reset to empty
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (isLoading && !wallet) {
    // Only show loading if we don't have cached data
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Header />
        <main className="container py-6 space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground">Loading dashboard...</p>
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

      <main className="container py-6 space-y-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-warning/10 border border-warning text-warning px-4 py-3 rounded-lg text-sm">
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-2">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name || "User"}!
          </h1>
          <p className="text-muted-foreground">Here's your wallet overview</p>
        </motion.div>

        {wallet && (
          <WalletCard
            balance={wallet.balance}
            currency={wallet.currency}
            localBalance={wallet.localBalance}
            localCurrency={wallet.localCurrency}
          />
        )}

        <QuickActions />

        <TransactionList
          transactions={transactions}
          showViewAll={true}
          limit={4}
        />
      </main>

      <BottomNav />
    </div>
  );
}
