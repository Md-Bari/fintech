"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [status, setStatus] = useState<"success" | "failed">("success");

  const transactionId =
    searchParams.get("transactionId") ??
    searchParams.get("tran_id") ??
    searchParams.get("transaction_id");

  const amount = searchParams.get("amount");
  const currency = searchParams.get("currency") ?? "BDT";

  // ✅ NEW: read backend status
  const statusParam = searchParams.get("status");

  useEffect(() => {
    setIsMounted(true);

    // ❌ if backend says failed or cancelled
    if (statusParam === "failed" || statusParam === "cancelled") {
      setStatus("failed");
      return;
    }

    // ❌ no transaction → failed
    if (!transactionId) {
      setStatus("failed");
      return;
    }

    // ✅ otherwise success
    setStatus("success");

  }, [transactionId, statusParam]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">

          {status === "success" ? (
            <>
              <CheckCircle2 className="text-green-500 mx-auto mb-4" size={48} />

              <h1 className="text-2xl font-bold mb-2">
                Payment Successful 🎉
              </h1>

              <p className="text-gray-500 mb-6">
                Your subscription is now active.
              </p>

              <div className="bg-gray-100 rounded-lg p-4 text-left mb-6">
                {transactionId && (
                  <p className="text-sm">
                    <strong>Transaction ID:</strong>
                    <br />
                    <span className="font-mono text-xs">
                      {transactionId}
                    </span>
                  </p>
                )}

                {amount && (
                  <p className="text-sm mt-2">
                    <strong>Amount:</strong> {currency} {amount}
                  </p>
                )}
              </div>

              <Link href="/">
                <Button className="w-full">
                  Go to Dashboard <ArrowRight size={16} />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <XCircle className="text-red-500 mx-auto mb-4" size={48} />

              <h1 className="text-xl font-bold mb-2">
                Payment Failed
              </h1>

              <p className="text-gray-500 mb-6">
                Your payment was not completed. Please try again.
              </p>

              {transactionId && (
                <p className="text-xs mb-4 font-mono">
                  {transactionId}
                </p>
              )}

              <Link href="/#plans">
                <Button className="w-full">Try Again</Button>
              </Link>
            </>
          )}

        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}