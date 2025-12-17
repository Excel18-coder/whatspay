import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Globe2,
  MessageCircle,
  RefreshCw,
  Shield,
  Smartphone,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Zap,
    title: "Instant Transfers",
    description:
      "Send stablecoins in seconds via WhatsApp. No waiting, no delays.",
  },
  {
    icon: Shield,
    title: "Secure & Encrypted",
    description:
      "Bank-grade security with end-to-end encryption for all transactions.",
  },
  {
    icon: Globe2,
    title: "Cross-Border Ready",
    description: "Send money anywhere in Africa with minimal fees.",
  },
  {
    icon: RefreshCw,
    title: "Easy Conversion",
    description: "Convert between fiat and stablecoins with real-time rates.",
  },
];

const steps = [
  {
    number: "01",
    title: "Deposit Fiat",
    description: "Add money via M-Pesa, bank, or card",
  },
  {
    number: "02",
    title: "Convert to USDC",
    description: "Get stablecoins at live exchange rates",
  },
  {
    number: "03",
    title: "Send via WhatsApp",
    description: "Share a link with any contact",
  },
  {
    number: "04",
    title: "Recipient Claims",
    description: "They get stablecoins instantly",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="absolute top-20 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="container relative py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Stablecoin Transfers Made Simple
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Send Money via <span className="text-gradient">WhatsApp</span>
              <br />
              Instantly & Securely
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Convert fiat to stablecoins and send to any WhatsApp contact. Low
              fees, instant transfers, no borders.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="xl"
                  className="w-full sm:w-auto">
                  <MessageCircle className="h-5 w-5" />
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 max-w-sm mx-auto">
            <Card variant="wallet" className="p-6 shadow-2xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-foreground rounded-full" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Balance</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                    Live
                  </span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  $1,250.00
                </div>
                <div className="text-sm text-muted-foreground">
                  ≈ KES 161,250
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button variant="default" size="sm">
                    Send
                  </Button>
                  <Button variant="outline" size="sm">
                    Deposit
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose WhatsPay?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for Africa's mobile-first economy with the stability of
              blockchain technology.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}>
                  <Card variant="wallet" className="p-6 h-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              Send stablecoins in just 4 simple steps
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-6 mb-8 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-primary-foreground font-bold">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-16 bg-border mt-2" />
                  )}
                </div>
                <div className="pt-2">
                  <h3 className="font-semibold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}>
            <Card
              variant="hero"
              className="p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJWMGgydjM0em0tNCAwVjBoLTJ2MzRoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
              <div className="relative z-10">
                <Smartphone className="h-12 w-12 text-primary-foreground/80 mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                  Ready to Send Money Smarter?
                </h2>
                <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                  Join thousands of users who trust WhatsPay for instant, secure
                  stablecoin transfers across Africa.
                </p>
                <Link to="/dashboard">
                  <Button
                    variant="glass"
                    size="xl"
                    className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/30">
                    Get Started Free
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <span className="text-sm font-bold text-primary-foreground">
                  W
                </span>
              </div>
              <span className="font-semibold text-foreground">WhatsPay</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 WhatsPay. Stablecoin transfers made simple.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
