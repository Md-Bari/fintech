"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Ban, ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const transactionId = searchParams.get("tran_id") ?? searchParams.get("transaction_id");

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-amber-50/20 to-background px-4 py-20">
      <div className="pointer-events-none fixed top-0 right-0 w-96 h-96 bg-amber-400/8 rounded-full blur-[120px] -mr-24 -mt-24" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-64 h-64 bg-amber-300/8 rounded-full blur-[100px] -ml-20 -mb-20" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full"
      >
        <div className="bg-card rounded-[2rem] shadow-2xl border border-amber-100 overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

          <div className="p-10 flex flex-col items-center text-center gap-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center"
            >
              <Ban size={44} className="text-amber-500" />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight">Payment Cancelled</h1>
              <p className="text-muted-foreground leading-relaxed">
                You cancelled the payment. Your subscription plan has not been activated and no charge was made.
              </p>
            </div>

            {transactionId && (
              <div className="w-full bg-muted/40 rounded-2xl p-5 space-y-3 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reference</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono font-semibold text-xs">{transactionId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-bold text-amber-600 uppercase text-xs tracking-wider">Cancelled</span>
                </div>
              </div>
            )}

            <div className="w-full p-4 rounded-2xl bg-muted/40 border border-border text-left flex items-start gap-3">
              <HelpCircle size={18} className="text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Changed your mind? You can always go back to our plans section and choose the subscription that fits you best.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Link href="/#plans" className="w-full">
                <Button className="gap-2 rounded-xl h-12 shadow-lg shadow-primary/20 w-full">
                  View Plans
                </Button>
              </Link>
              <Link href="/" className="w-full">
                <Button variant="outline" className="gap-2 rounded-xl h-12 w-full">
                  <ArrowLeft size={18} />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>}>
      <PaymentCancelContent />
    </Suspense>
  );
}
