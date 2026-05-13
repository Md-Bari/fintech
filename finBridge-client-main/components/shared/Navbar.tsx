"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

const baseNavLinks = [
  { name: "Home", href: "/" },
  { name: "Find Loans", href: "/loans" },
  { name: "Plans", href: "/#plans" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About Us", href: "/about" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, logout, user } = useAuthStore();

  const navLinks = !isMounted ? baseNavLinks : isAuthenticated ? baseNavLinks : [
    ...baseNavLinks,
    { name: "Register as Entrepreneur", href: "/register/entrepreneur" },
    { name: "Register as MFI Institution", href: "/register/mfi" },
  ];

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 px-4 py-4",
        scrolled ? "bg-background/80 backdrop-blur-md border-b" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">FB</span>
          </div>
          <span className="text-2xl font-bold tracking-tight hidden sm:block">
            fin<span className="text-primary">Bridge</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          {!isMounted ? (
            <div className="w-24 h-9 bg-muted animate-pulse rounded-md"></div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground mr-2">
                Hi, {user?.name}
              </span>
              <Link href={user?.role?.toLowerCase().includes("mfi") ? "/mfi" : user?.role?.toLowerCase().includes("admin") ? "/admin" : "/entrepreneur"}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Button size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" className="gap-2">
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden p-2 text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-background border-b lg:hidden px-4 py-8 flex flex-col gap-6 shadow-xl"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-lg font-medium",
                  pathname === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t flex flex-col gap-4">
              {isAuthenticated ? (
                <>
                  <div className="text-center font-bold text-lg mb-2 text-primary">
                    {user?.name}
                  </div>
                  <Link href={user?.role?.toLowerCase().includes("mfi") ? "/mfi" : user?.role?.toLowerCase().includes("admin") ? "/admin" : "/entrepreneur"} onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Button className="w-full" onClick={() => { logout(); setIsOpen(false); }}>
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button className="w-full">Login</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
