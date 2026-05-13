"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, Clock, Percent, Building2, Lock } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";

interface LoanProduct {
  id: string;
  mfi_id: string;
  name: string;
  description: string | null;
  min_amount: string | null;
  max_amount: string;
  interest_rate: string;
  processing_fee: string | null;
  duration_months: number;
  mfi_name: string;
}

export default function LoansPage() {
  const [loans, setLoans] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const fetchLoans = async () => {
      try {
        const response = await api.get("/loan-products");
        setLoans(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch loans:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  const handleApply = (loan: LoanProduct) => {
    if (!isAuthenticated) {
      // Not logged in → go to entrepreneur registration
      router.push("/register/entrepreneur");
      return;
    }
    const role = user?.role?.toLowerCase();
    if (role === "entrepreneur") {
      // Entrepreneur → go to apply form with query params
      router.push(`/apply-loan?mfi_id=${loan.mfi_id}&loan_product_id=${loan.id}`);
    }
    // Other roles: button is disabled, do nothing
  };

  const getButtonState = (isMounted: boolean, isAuthenticated: boolean, role?: string | null) => {
    if (!isMounted) return { disabled: false, label: "Apply Now", tooltip: null };
    if (!isAuthenticated) return { disabled: false, label: "Apply Now", tooltip: null };
    const r = role?.toLowerCase();
    if (r === "entrepreneur") return { disabled: false, label: "Apply Now", tooltip: null };
    return { disabled: true, label: "Apply Now", tooltip: "Only entrepreneurs can apply for loans" };
  };

  return (
    <div className="min-h-screen bg-muted/20 pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Available Loan Products</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse and compare microfinance loans from verified institutions across Bangladesh.
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse border-transparent shadow-none">
                <CardHeader className="h-24 bg-muted/50 rounded-t-xl" />
                <CardContent className="h-32 bg-muted/20" />
              </Card>
            ))}
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-xl">No loan products available right now.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loans.map((loan, index) => {
              const btnState = getButtonState(isMounted, isAuthenticated, user?.role);
              return (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 border-primary/10 hover:border-primary/30 group">
                    <CardHeader>
                      <div className="flex items-center gap-2 text-sm text-primary font-semibold mb-2 bg-primary/10 w-fit px-3 py-1 rounded-full">
                        <Building2 size={14} />
                        {loan.mfi_name}
                      </div>
                      <CardTitle className="text-2xl group-hover:text-primary transition-colors">{loan.name}</CardTitle>
                      {loan.description && (
                        <CardDescription>{loan.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 p-3 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Banknote size={16} /> Amount Limit
                          </div>
                          <p className="font-bold text-lg">৳ {loan.min_amount ? Number(loan.min_amount).toLocaleString() : "0"} - ৳ {Number(loan.max_amount).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1 p-3 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Percent size={16} /> Interest Rate
                          </div>
                          <p className="font-bold text-lg">{loan.interest_rate}% APR</p>
                        </div>
                        <div className="col-span-2 space-y-1 p-3 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Clock size={16} /> Duration
                          </div>
                          <p className="font-bold text-lg">{loan.duration_months} Months</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                      <div className="relative w-full group/btn">
                        <Button
                          className="w-full rounded-xl"
                          size="lg"
                          disabled={btnState.disabled}
                          onClick={() => handleApply(loan)}
                        >
                          {btnState.disabled && <Lock size={16} className="mr-2" />}
                          {btnState.label}
                        </Button>
                        {btnState.tooltip && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-foreground text-background text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none z-10">
                            {btnState.tooltip}
                          </div>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



