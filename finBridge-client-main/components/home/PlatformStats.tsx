"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Landmark, HandCoins, Globe } from "lucide-react";

type PlatformStatsData = {
  active_entrepreneurs: number;
  verified_mfis: number;
  approved_loan_volume: number;
  districts_covered: number;
};

export default function PlatformStats() {
  const [stats, setStats] = React.useState<PlatformStatsData | null>(null);

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "https://literature-unexpected-cheaper-roughly.trycloudflare.com/api/v1"}/platform/stats`);
        const json = await res.json();
        if (json?.success) {
          setStats({
            active_entrepreneurs: Number(json.data?.active_entrepreneurs ?? 0),
            verified_mfis: Number(json.data?.verified_mfis ?? 0),
            approved_loan_volume: Number(json.data?.approved_loan_volume ?? 0),
            districts_covered: Number(json.data?.districts_covered ?? 0),
          });
        }
      } catch {
        setStats(null);
      }
    };

    loadStats();
  }, []);

  const cards = [
    {
      icon: <Users className="text-primary" />,
      value: stats ? stats.active_entrepreneurs.toLocaleString() : "...",
      label: "Active Entrepreneurs",
      detail: "Growing businesses",
    },
    {
      icon: <Landmark className="text-secondary" />,
      value: stats ? stats.verified_mfis.toLocaleString() : "...",
      label: "Verified MFIs",
      detail: "Trusted institutions",
    },
    {
      icon: <HandCoins className="text-green-500" />,
      value: stats ? `BDT ${Math.round(stats.approved_loan_volume).toLocaleString()}` : "...",
      label: "Approved Loan Volume",
      detail: "Capital in motion",
    },
    {
      icon: <Globe className="text-blue-500" />,
      value: stats ? stats.districts_covered.toLocaleString() : "...",
      label: "Districts Covered",
      detail: "Nationwide reach",
    },
  ];

  return (
    <section className="py-16 bg-zinc-950 text-white overflow-hidden relative">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {cards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center space-y-2 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4">
                {stat.icon}
              </div>
              <h3 className="text-3xl md:text-5xl font-black tracking-tight">{stat.value}</h3>
              <div className="space-y-1">
                <p className="font-bold text-zinc-300">{stat.label}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">{stat.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
