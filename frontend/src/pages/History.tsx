import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { TransactionItem } from "@/components/transactions/TransactionItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { motion } from "framer-motion";
import { Download, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const filters = ["All", "Sent", "Received", "Deposits", "Withdrawals"];

export default function History() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [transactions, setTransactions] = useState<any[]>(() => {
    const cached = sessionStorage.getItem("cachedHistory");
    return cached ? JSON.parse(cached) : [];
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

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const txData = await api.transaction.getTransactions(userId);
        if (isMounted) {
          const txArray = Array.isArray(txData) ? txData : [];
          setTransactions(txArray);
          sessionStorage.setItem("cachedHistory", JSON.stringify(txArray));
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        if (isMounted) {
          setError("Failed to load transactions. Using cached data.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTransactions();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Sent") return tx.type === "send";
    if (activeFilter === "Received") return tx.type === "receive";
    if (activeFilter === "Deposits") return tx.type === "deposit";
    if (activeFilter === "Withdrawals") return tx.type === "withdraw";
    return true;
  });

  if (isLoading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Header />
        <main className="container py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground">Loading transactions...</p>
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
          className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Transaction History
            </h1>
            <p className="text-muted-foreground">
              All your transfers and conversions
            </p>
          </div>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "shrink-0",
                activeFilter === filter && "shadow-md"
              )}>
              {filter}
            </Button>
          ))}
        </motion.div>
        <Card variant="default" className="overflow-hidden">
          <CardContent className="p-2">
            {filteredTransactions.length > 0 ? (
              <div className="space-y-1">
                {filteredTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}>
                    <TransactionItem transaction={transaction} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Filter className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
