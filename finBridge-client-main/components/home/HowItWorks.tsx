"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Search, Send, CheckCircle, Landmark, ClipboardList, ShieldCheck, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const entrepreneurSteps = [
  {
    icon: UserPlus,
    title: "Create Profile",
    desc: "Register and complete your business profile with basic details and documents.",
  },
  {
    icon: Search,
    title: "Explore Products",
    desc: "Compare different microfinance products from verified institutions in Bangladesh.",
  },
  {
    icon: Send,
    title: "Apply Online",
    desc: "Submit your application digitally in minutes. No need for physical branch visits.",
  },
  {
    icon: CheckCircle,
    title: "Track Status",
    desc: "Monitor your application progress in real-time and get notified on approval.",
  },
];

const mfiSteps = [
  {
    icon: Landmark,
    title: "Onboard MFI",
    desc: "Register your institution and get verified by our platform administrators.",
  },
  {
    icon: ClipboardList,
    title: "List Products",
    desc: "Create and manage your microfinance loan products with custom terms.",
  },
  {
    icon: ShieldCheck,
    title: "Review Apps",
    desc: "Access verified entrepreneur applications and documentation securely.",
  },
  {
    icon: CreditCard,
    title: "Disburse Funds",
    desc: "Approve applications and manage your lending pipeline through our dashboard.",
  },
];

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState<"entrepreneur" | "mfi">("entrepreneur");

  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-950/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">How finBridge Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We've simplified the entire microfinance lifecycle for both borrowers and lenders.
          </p>
          
          <div className="flex items-center justify-center pt-8">
            <div className="inline-flex p-1 bg-muted rounded-2xl border">
              <button
                onClick={() => setActiveTab("entrepreneur")}
                className={cn(
                  "px-6 py-3 rounded-xl font-bold transition-all",
                  activeTab === "entrepreneur" ? "bg-background shadow-lg text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                For Entrepreneurs
              </button>
              <button
                onClick={() => setActiveTab("mfi")}
                className={cn(
                  "px-6 py-3 rounded-xl font-bold transition-all",
                  activeTab === "mfi" ? "bg-background shadow-lg text-secondary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                For Institutions
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {(activeTab === "entrepreneur" ? entrepreneurSteps : mfiSteps).map((step, index) => (
              <div
                key={index}
                className="relative p-8 bg-background rounded-3xl border hover:border-primary/30 transition-all hover:shadow-xl group"
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform",
                  activeTab === "entrepreneur" ? "bg-primary/5 text-primary" : "bg-secondary/5 text-secondary"
                )}>
                  <step.icon size={32} />
                </div>
                <div className="absolute top-8 right-8 text-4xl font-black text-muted/10 italic">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
