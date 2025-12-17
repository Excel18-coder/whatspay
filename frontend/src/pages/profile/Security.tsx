import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { ArrowLeft, Key, Lock, Shield, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Security() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    twoFactorEnabled: true,
    biometricEnabled: false,
    loginNotifications: true,
  });

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <main className="container py-6 max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
            className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Security & PIN
            </h1>
            <p className="text-muted-foreground">
              Manage your security settings
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change PIN</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPin">Current PIN</Label>
                <Input
                  id="currentPin"
                  type="password"
                  maxLength={4}
                  placeholder="****"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPin">New PIN</Label>
                <Input
                  id="newPin"
                  type="password"
                  maxLength={4}
                  placeholder="****"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPin">Confirm New PIN</Label>
                <Input
                  id="confirmPin"
                  type="password"
                  maxLength={4}
                  placeholder="****"
                />
              </div>
              <Button className="w-full">
                <Key className="mr-2 h-4 w-4" />
                Update PIN
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base font-medium">
                      Two-Factor Authentication
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security
                  </p>
                </div>
                <Switch
                  checked={settings.twoFactorEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, twoFactorEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base font-medium">
                      Biometric Login
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use fingerprint or face ID
                  </p>
                </div>
                <Switch
                  checked={settings.biometricEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, biometricEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base font-medium">
                      Login Notifications
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new logins
                  </p>
                </div>
                <Switch
                  checked={settings.loginNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, loginNotifications: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between p-3 bg-muted rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">Current Device</p>
                  <p className="text-sm text-muted-foreground">
                    Linux • Firefox • Nairobi, Kenya
                  </p>
                  <p className="text-xs text-muted-foreground">Active now</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                  Active
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
