import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/services/api";
import { motion } from "framer-motion";
import { ArrowDownUp, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const currencies = [
  { code: "USDC", name: "USD Coin", flag: "💵" },
  { code: "KES", name: "Kenyan Shilling", flag: "🇰🇪" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
];

export default function Convert() {
  const navigate = useNavigate();
  const [fromCurrency, setFromCurrency] = useState("USDC");
  const [toCurrency, setToCurrency] = useState("KES");
  const [amount, setAmount] = useState("");
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    // Fetch exchange rates
    api.exchange
      .getRates()
      .then((rates: any) => {
        const ratesObj: any = {};
        rates.forEach((rate: any) => {
          ratesObj[rate.currency] = parseFloat(rate.rate);
        });
        setExchangeRates(ratesObj);
      })
      .catch(() => setExchangeRates({}));
  }, [navigate]);

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    try {
      const response: any = await api.exchange.convert(
        fromCurrency,
        toCurrency,
        parseFloat(amount)
      );
      setConvertedAmount(response.convertedAmount);
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Conversion failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setConvertedAmount(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />
      <main className="container py-6 max-w-lg mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Currency Converter
          </h1>
          <p className="text-muted-foreground">
            Convert between different currencies
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Convert Currency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* From Currency */}
              <div className="space-y-2">
                <Label htmlFor="from-currency">From</Label>
                <div className="flex gap-2">
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.flag} {currency.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setConvertedAmount(null);
                    }}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={swapCurrencies}
                  className="rounded-full">
                  <ArrowDownUp className="h-4 w-4" />
                </Button>
              </div>

              {/* To Currency */}
              <div className="space-y-2">
                <Label htmlFor="to-currency">To</Label>
                <div className="flex gap-2">
                  <Select value={toCurrency} onValueChange={setToCurrency}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.flag} {currency.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex-1 flex items-center px-3 py-2 border rounded-md bg-muted">
                    <span className="text-lg font-semibold">
                      {convertedAmount !== null
                        ? convertedAmount.toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exchange Rate Info */}
              {exchangeRates[fromCurrency] && exchangeRates[toCurrency] && (
                <div className="text-sm text-muted-foreground text-center">
                  1 {fromCurrency} ={" "}
                  {(
                    exchangeRates[toCurrency] / exchangeRates[fromCurrency]
                  ).toFixed(4)}{" "}
                  {toCurrency}
                </div>
              )}

              {/* Convert Button */}
              <Button
                onClick={handleConvert}
                disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                className="w-full"
                size="lg">
                {isLoading ? (
                  "Converting..."
                ) : (
                  <>
                    Convert <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}
