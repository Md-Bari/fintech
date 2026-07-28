"use client";

import React from "react";
import SubscriptionPlans from "@/components/home/SubscriptionPlans";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function AllPlansPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner Header */}
      <div className="bg-muted/50 border-b py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
                <Sparkles size={14} />
                Full Catalog
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                All Subscription Packages
              </h1>
              <p className="text-muted-foreground text-base max-w-2xl mt-1">
                Explore our full list of tier options and custom solutions designed for Microfinance Institutions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Render All Plans */}
      <main>
        <SubscriptionPlans />
      </main>
    </div>
  );
}
