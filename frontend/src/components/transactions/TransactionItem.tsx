import { cn } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Repeat,
  XCircle,
} from "lucide-react";

export interface Transaction {
  id: string;
  type: "send" | "receive" | "convert" | "deposit" | "withdraw";
  amount: number;
  currency: string;
  recipient?: string;
  sender?: string;
  status: "completed" | "pending" | "failed";
  timestamp?: Date | string;
  createdAt?: Date | string;
  fee?: number;
}

interface TransactionItemProps {
  transaction: Transaction;
}

const typeConfig = {
  send: { icon: ArrowUpRight, label: "Sent to", color: "text-destructive" },
  receive: {
    icon: ArrowDownLeft,
    label: "Received from",
    color: "text-success",
  },
  convert: { icon: Repeat, label: "Converted", color: "text-primary" },
  deposit: { icon: ArrowDownLeft, label: "Deposited", color: "text-success" },
  withdraw: {
    icon: ArrowUpRight,
    label: "Withdrawn",
    color: "text-destructive",
  },
};

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  failed: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

export function TransactionItem({ transaction }: TransactionItemProps) {
  const typeInfo = typeConfig[transaction.type];
  const statusInfo = statusConfig[transaction.status];
  const Icon = typeInfo.icon;
  const StatusIcon = statusInfo.icon;

  const isOutgoing =
    transaction.type === "send" || transaction.type === "withdraw";
  const displayName = transaction.recipient || transaction.sender || "Unknown";

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer">
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          statusInfo.bg
        )}>
        <Icon className={cn("h-5 w-5", typeInfo.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">
            {typeInfo.label} {displayName}
          </p>
          <StatusIcon className={cn("h-4 w-4 shrink-0", statusInfo.color)} />
        </div>
        <p className="text-sm text-muted-foreground">
          {(() => {
            const date = transaction.timestamp || transaction.createdAt;
            if (!date) return "Just now";
            try {
              return new Date(date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
            } catch {
              return "Just now";
            }
          })()}
        </p>
      </div>

      <div className="text-right">
        <p
          className={cn(
            "font-semibold",
            isOutgoing ? "text-destructive" : "text-success"
          )}>
          {isOutgoing ? "-" : "+"}
          {transaction.amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}{" "}
          {transaction.currency}
        </p>
        {transaction.fee && (
          <p className="text-xs text-muted-foreground">
            Fee: ${transaction.fee.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}
