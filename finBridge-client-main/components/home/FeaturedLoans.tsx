"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Info, Landmark, Banknote, Percent, Clock, Loader2, Sparkles, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

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

export default function FeaturedLoans() {
  const [loans, setLoans] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const response = await api.get("/loan-products");
        // We only show the first 3 products as "featured"
        setLoans((response.data.data || []).slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch featured loans:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  const handleApply = (loan: LoanProduct) => {
    if (!isAuthenticated) {
      router.push("/register/entrepreneur");
      return;
    }
    const role = user?.role?.toLowerCase();
    if (role === "entrepreneur") {
      router.push(`/apply-loan?mfi_id=${loan.mfi_id}&loan_product_id=${loan.id}`);
    }
  };

  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-950/30 overflow-hidden relative">
      {/* Decorative background blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] -ml-48 -mb-48" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
              <Sparkles size={12} />
              Marketplace Preview
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight italic underline decoration-secondary/30 decoration-4 underline-offset-8">Featured Loan Products</h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Explore the latest microfinance offerings from our verified MFI partners in Bangladesh.
            </p>
          </div>
          <Link href="/loans">
            <Button variant="outline" className="h-12 px-6 rounded-xl gap-2 font-bold group">
              Browse Marketplace <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[450px] w-full bg-muted/40 animate-pulse rounded-[2rem] border-2 border-dashed border-muted" />
            ))}
          </div>
        ) : loans.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-background border-2 border-dashed rounded-[3rem] space-y-6"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
              <Clock size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">New Products Coming Soon</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Our partner MFIs are currently updating their loan product listings. Check back shortly for the latest opportunities.
              </p>
            </div>
            <Button variant="secondary" className="rounded-xl px-8" disabled>
              Notify Me When Available
            </Button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loans.map((loan, index) => (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="rounded-[2.5rem] overflow-hidden border-2 border-primary/5 hover:border-primary/40 transition-all duration-500 group flex flex-col h-full bg-background shadow-lg hover:shadow-2xl hover:-translate-y-2">
                  <CardHeader className="bg-zinc-50 dark:bg-zinc-950/50 p-8 flex flex-row items-center gap-4 border-b border-zinc-100 dark:border-zinc-900">
                    <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center text-primary shadow-inner border border-primary/10">
                      <Landmark size={28} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{loan.mfi_name}</p>
                      <h3 className="text-xl font-bold tracking-tight line-clamp-1">{loan.name}</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8 flex-1">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-3 py-1">Verified MFI</Badge>
                        <Badge variant="secondary" className="bg-secondary/5 text-secondary border-secondary/10 px-3 py-1 italic font-bold">New Listing</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {loan.description || "Empowering small businesses through accessible capital and transparent lending terms."}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Banknote size={14} className="text-zinc-400" />
                          <p className="text-[10px] uppercase font-black tracking-widest">Amount</p>
                        </div>
                        <p className="font-black text-lg">৳{Number(loan.max_amount).toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Percent size={14} className="text-zinc-400" />
                          <p className="text-[10px] uppercase font-black tracking-widest">Interest</p>
                        </div>
                        <p className="font-black text-lg text-primary">{loan.interest_rate}% APR</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock size={14} className="text-zinc-400" />
                          <p className="text-[10px] uppercase font-black tracking-widest">Tenure</p>
                        </div>
                        <p className="font-black text-lg">{loan.duration_months} Months</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-0 mt-auto">
                    <Button 
                      onClick={() => handleApply(loan)}
                      disabled={user?.role?.toLowerCase() !== "entrepreneur" && isAuthenticated}
                      className="w-full rounded-2xl h-14 font-black shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isAuthenticated && user?.role?.toLowerCase() !== "entrepreneur" ? "Entrepreneurs Only" : "Apply for Loan"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
