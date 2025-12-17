import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";

interface WalletCardProps {
  balance: number;
  currency: string;
  localBalance?: number;
  localCurrency?: string;
}

export function WalletCard({
  balance = 1250.00,
  currency = "USDC",
  localBalance = 161250.00,
  localCurrency = "KES",
}: WalletCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card variant="hero" className="relative overflow-hidden p-6">
        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-primary-foreground/5 blur-xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-primary-foreground/80">
              Total Balance
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>

          <div className="mb-1">
            <span className="text-4xl font-bold text-primary-foreground">
              {showBalance ? `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : "••••••"}
            </span>
            <span className="ml-2 text-lg text-primary-foreground/80">{currency}</span>
          </div>

          <div className="mb-6">
            <span className="text-sm text-primary-foreground/70">
              ≈ {showBalance ? `${localCurrency} ${localBalance.toLocaleString()}` : "••••••"}
            </span>
          </div>

          <div className="flex gap-3">
            <Link to="/send" className="flex-1">
              <Button variant="glass" className="w-full bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/30">
                <ArrowUpRight className="h-4 w-4" />
                Send
              </Button>
            </Link>
            <Link to="/deposit" className="flex-1">
              <Button variant="glass" className="w-full bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/30">
                <ArrowDownLeft className="h-4 w-4" />
                Deposit
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
