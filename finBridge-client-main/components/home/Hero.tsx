"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { ArrowRight, ShieldCheck, Zap, Sparkles } from "lucide-react";

export default function Hero() {
  const { isAuthenticated, user } = useAuthStore();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Dynamic background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] -ml-24 -mb-24" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold shadow-sm">
            <Sparkles size={16} />
            <span>Empowering Financial Inclusion in Bangladesh</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
              The <span className="text-primary italic underline decoration-secondary/30">Bridge</span> to <br />
              Your Growth
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-xl leading-relaxed font-medium">
              finBridge connects ambitious entrepreneurs with verified Microfinance Institutions. 
              Secure your business future with zero friction.
            </p>
          </div>

          {!isMounted ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="h-16 w-56 bg-muted animate-pulse rounded-2xl"></div>
              <div className="h-16 w-56 bg-muted animate-pulse rounded-2xl"></div>
            </div>
          ) : isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href={user?.role?.toLowerCase().includes("mfi") ? "/mfi" : user?.role?.toLowerCase().includes("admin") ? "/admin" : "/entrepreneur"}
                className={cn(buttonVariants({ size: "lg" }), "h-16 px-10 text-lg gap-2 group w-full sm:w-auto rounded-2xl font-bold")}
              >
                Go to Your Dashboard
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/register/entrepreneur" 
                className={cn(buttonVariants({ size: "lg" }), "h-16 px-10 text-lg gap-2 group w-full sm:w-auto rounded-2xl font-bold")}
              >
                Get Started
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/register/mfi" 
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-16 px-10 text-lg w-full sm:w-auto rounded-2xl font-bold bg-background/50 backdrop-blur-sm")}
              >
                Register as MFI
              </Link>
            </div>
          )}

          <div className="flex items-center gap-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-14 h-14 rounded-full border-4 border-background bg-zinc-100 overflow-hidden shadow-lg transition-transform hover:scale-110 hover:z-10 cursor-pointer">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div>
              <p className="font-black text-2xl tracking-tight">10,000+</p>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Active Entrepreneurs</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          {/* Main card */}
          <div className="relative z-10 bg-white dark:bg-zinc-900 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-zinc-200 dark:border-zinc-800 p-10 overflow-hidden">
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Digital Application</p>
                <h3 className="text-3xl font-black tracking-tight italic">Small Business Loan</h3>
              </div>
              <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
                <ShieldCheck size={32} />
              </div>
            </div>

            <div className="space-y-8">
              <div className="p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-950 space-y-4 border border-zinc-100 dark:border-zinc-900">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-muted-foreground">Requested Amount</span>
                  <span className="text-primary text-lg font-black">৳ 75,000</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 1.5, delay: 1 }}
                    className="bg-primary h-full rounded-full" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-2">Interest</p>
                  <p className="text-2xl font-black">8.5%</p>
                </div>
                <div className="p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-2">Tenure</p>
                  <p className="text-2xl font-black">18 Mo.</p>
                </div>
              </div>

              <Button className="w-full h-16 rounded-2xl text-lg font-black shadow-lg shadow-primary/20" disabled>
                <Zap className="mr-2 fill-current" size={20} />
                Processing Identity...
              </Button>
            </div>
          </div>
          
          {/* Decorative floating elements */}
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" 
          />
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl" 
          />
        </motion.div>
      </div>
    </section>
  );
}

