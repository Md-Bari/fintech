"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, Shield, BarChart3 } from "lucide-react";

const solutions = [
  {
    icon: <Zap className="text-primary" />,
    title: "Instant Digital Applications",
    description: "Submit your loan request in minutes from anywhere in Bangladesh using our streamlined portal.",
  },
  {
    icon: <BarChart3 className="text-primary" />,
    title: "Real-time Tracking",
    description: "Monitor every stage of your application with automated notifications and status updates.",
  },
  {
    icon: <Shield className="text-primary" />,
    title: "Secure Document Vault",
    description: "Upload and store your NID and trade licenses securely. Only verified MFIs can access them.",
  },
  {
    icon: <CheckCircle2 className="text-primary" />,
    title: "Verified MFI Network",
    description: "Connect only with reputable institutions that are vetted for quality and fair lending practices.",
  },
];

export default function SolutionOverview() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                The <span className="text-primary">Bridge</span> to Modern Microfinance
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                finBridge isn't just a website; it's a complete ecosystem designed to remove friction from the lending process.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {solutions.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-[4rem] p-4 md:p-8">
              <div className="w-full h-full bg-background border rounded-[3.5rem] shadow-2xl overflow-hidden relative group">
                <img 
                  src="/sectionImage.png" 
                  alt="Happy Bangladeshi Entrepreneur" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 space-y-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Success Story</p>
                  <h4 className="text-white text-xl font-black italic">"finBridge unlocked my business potential in just 48 hours."</h4>
                  <p className="text-white/80 text-sm font-medium">— Anannya, Boutique Owner, Dhaka</p>
                </div>
              </div>
            </div>
            
            {/* Floating badge */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-background border p-4 rounded-2xl shadow-xl flex items-center gap-3 z-20"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                <CheckCircle2 />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Status</p>
                <p className="font-bold">Loan Approved</p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
