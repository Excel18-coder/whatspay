import { motion } from "framer-motion";
import { TransactionItem, Transaction } from "./TransactionItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface TransactionListProps {
  transactions: Transaction[];
  showViewAll?: boolean;
  title?: string;
  limit?: number;
}

export function TransactionList({
  transactions,
  showViewAll = true,
  title = "Recent Transactions",
  limit = 5,
}: TransactionListProps) {
  const displayedTransactions = limit ? transactions.slice(0, limit) : transactions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card variant="default" className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          {showViewAll && (
            <Link to="/history">
              <Button variant="ghost" size="sm" className="text-primary">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent className="p-2">
          {displayedTransactions.length > 0 ? (
            <div className="space-y-1">
              {displayedTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <TransactionItem transaction={transaction} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No transactions yet</p>
              <Link to="/deposit">
                <Button variant="hero" size="sm" className="mt-4">
                  Make your first deposit
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
