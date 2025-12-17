import { motion } from "framer-motion";
import { ArrowDownToLine, QrCode, Repeat, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  {
    icon: Repeat,
    label: "Convert",
    path: "/convert",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: QrCode,
    label: "QR Pay",
    path: "/qr",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Smartphone,
    label: "Mobile",
    path: "/deposit",
    color: "bg-success/10 text-success",
  },
  {
    icon: ArrowDownToLine,
    label: "Withdraw",
    path: "/withdraw",
    color: "bg-warning/10 text-warning",
  },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-4 gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Link key={action.label} to={action.path}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${action.color} transition-all duration-200 hover:scale-105`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {action.label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </motion.div>
  );
}
