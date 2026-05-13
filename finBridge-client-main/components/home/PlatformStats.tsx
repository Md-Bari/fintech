"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Landmark, HandCoins, Globe } from "lucide-react";

const stats = [
  {
    icon: <Users className="text-primary" />,
    value: "10,000+",
    label: "Active Entrepreneurs",
    detail: "Growing businesses",
  },
  {
    icon: <Landmark className="text-secondary" />,
    value: "150+",
    label: "Verified MFIs",
    detail: "Trusted institutions",
  },
  {
    icon: <HandCoins className="text-green-500" />,
    value: "৳ 5.2Cr",
    label: "Loans Disbursed",
    detail: "Capital in motion",
  },
  {
    icon: <Globe className="text-blue-500" />,
    value: "64",
    label: "Districts Covered",
    detail: "Nationwide reach",
  },
];

export default function PlatformStats() {
  return (
    <section className="py-16 bg-zinc-950 text-white overflow-hidden relative">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 100, 
                delay: i * 0.1 
              }}
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
