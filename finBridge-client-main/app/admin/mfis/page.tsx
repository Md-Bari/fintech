"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MFI {
  id: string;
  name: string;
  status: "active" | "inactive" | "pending" | string;
  created_at: string;
}

export default function AdminMFIsPage() {
  const [mfis, setMfis] = useState<MFI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMfis = async () => {
      try {
        const res = await api.get("/admin/mfis");
        const data = res.data?.data || [];
        setMfis(data);
      } catch (err) {
        console.error("Failed to fetch MFIs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMfis();
  }, []);

  const activeCount = mfis.filter(m => m.status === "active").length;

  return (
    <div className="space-y-8 pb-10">
      <div className="relative rounded-[2rem] overflow-hidden bg-primary p-8 md:p-10 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
              <Landmark size={12} /> Institution Management
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Registered MFIs</h1>
            <p className="text-primary-foreground/70 text-sm max-w-md leading-relaxed">
              View and manage all Microfinance Institutions onboarded to the platform.
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-sm shrink-0 min-w-[160px]">
            <p className="text-sm text-primary-foreground/70 mb-1">Active Institutions</p>
            <p className="text-3xl font-extrabold">{activeCount}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading institutions list…</p>
        </div>
      ) : mfis.length === 0 ? (
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardContent className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Landmark size={28} className="text-muted-foreground" />
            </div>
            <p className="font-bold">No MFIs Found</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              There are currently no Microfinance Institutions registered on the platform.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[2rem] border-none shadow-sm p-6">
          <CardHeader className="px-0 pt-0 mb-4">
            <CardTitle className="text-xl font-extrabold tracking-tight">Institution Ledger</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="pb-4 font-bold pl-4">Institution Name</th>
                    <th className="pb-4 font-bold">MFI ID</th>
                    <th className="pb-4 font-bold">Registration Date</th>
                    <th className="pb-4 font-bold text-right pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mfis.map((mfi, i) => (
                    <motion.tr 
                      key={mfi.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                            {mfi.name.substring(0, 2).toUpperCase()}
                          </div>
                          <p className="font-bold text-sm">{mfi.name}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="font-mono text-xs font-medium text-muted-foreground">{mfi.id}</p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm font-medium">{new Date(mfi.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </td>
                      <td className="py-4 text-right pr-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ml-auto",
                          mfi.status === "active" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                          mfi.status === "inactive" ? "text-destructive bg-destructive/10 border-destructive/20" :
                          "text-amber-600 bg-amber-50 border-amber-200"
                        )}>
                          {mfi.status === "active" && <CheckCircle2 size={12} />}
                          {mfi.status === "inactive" && <XCircle size={12} />}
                          {mfi.status === "pending" && <Clock size={12} />}
                          {mfi.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
