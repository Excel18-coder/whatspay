import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Bell, Menu, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [profilePicture, setProfilePicture] = useState<string>("");

  useEffect(() => {
    // Check for cached user profile picture
    const cached = sessionStorage.getItem("cachedUserProfile");
    if (cached) {
      try {
        const user = JSON.parse(cached);
        setProfilePicture(user.profilePicture || "");
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [location.pathname]); // Re-check when location changes

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          {!isHome && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
              <span className="text-lg font-bold text-primary-foreground">
                W
              </span>
            </div>
            <span className="text-xl font-bold text-foreground">WhatsPay</span>
          </Link>
        </div>

        {!isHome && (
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/dashboard">
              <Button
                variant={
                  location.pathname === "/dashboard" ? "secondary" : "ghost"
                }
                size="sm">
                Dashboard
              </Button>
            </Link>
            <Link to="/send">
              <Button
                variant={location.pathname === "/send" ? "secondary" : "ghost"}
                size="sm">
                Send
              </Button>
            </Link>
            <Link to="/deposit">
              <Button
                variant={
                  location.pathname === "/deposit" ? "secondary" : "ghost"
                }
                size="sm">
                Deposit
              </Button>
            </Link>
            <Link to="/history">
              <Button
                variant={
                  location.pathname === "/history" ? "secondary" : "ghost"
                }
                size="sm">
                History
              </Button>
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {!isHome && (
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                3
              </span>
            </Button>
          )}
          <Link to={isHome ? "/dashboard" : "/profile"}>
            <Button
              variant={isHome ? "hero" : "ghost"}
              size={isHome ? "default" : "icon"}
              className={!isHome && profilePicture ? "p-1" : ""}>
              {isHome ? (
                "Get Started"
              ) : profilePicture && profilePicture.trim() !== "" ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover bg-muted"
                  onError={(e) => {
                    console.error("Failed to load profile picture in header");
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
