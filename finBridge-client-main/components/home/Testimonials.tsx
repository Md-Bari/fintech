"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

export default function Testimonials() {
  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-950/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Voices of <span className="text-primary">Success</span></h2>
          <p className="text-lg text-muted-foreground">
            Join the growing community of entrepreneurs and institutions transforming microfinance in Bangladesh.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 bg-background rounded-3xl border shadow-sm hover:shadow-md transition-shadow relative"
            >
              <div className="flex gap-1 text-accent mb-6">
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={16} fill="currentColor" />)}
              </div>
              <p className="text-lg italic leading-relaxed mb-8 text-zinc-700 dark:text-zinc-300">
                {i === 1 ? "The easiest way to compare loan rates in Bangladesh. I saved thousands on interest by finding the right partner through finBridge." : 
                 i === 2 ? "As an MFI, this platform has completely transformed how we reach rural borrowers. The document verification is a lifesaver." : 
                 "I was able to scale my poultry farm in months thanks to the quick disbursement and transparent process of the MFI I found here."}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-muted overflow-hidden border-2 border-primary/20">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=success${i + 20}`} alt="avatar" />
                </div>
                <div>
                  <p className="font-bold text-lg">{i === 1 ? "Mohammad Karim" : i === 2 ? "Selina Akter" : "Abdur Rahman"}</p>
                  <p className="text-sm text-muted-foreground font-medium">{i === 1 ? "Retail Shop Owner" : i === 2 ? "MFI Branch Head" : "Agro-Entrepreneur"}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
