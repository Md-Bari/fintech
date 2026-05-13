"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[3rem] overflow-hidden bg-primary text-primary-foreground p-8 md:p-16 text-center space-y-8"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -ml-32 -mb-32" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-sm font-bold">
              <Sparkles size={16} />
              Ready to Bridge the Gap?
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
              Start Your Financial <br /> Journey Today
            </h2>
            
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
              Join thousands of entrepreneurs and institutions already using finBridge to drive economic growth across Bangladesh.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register/entrepreneur" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-bold w-full gap-2">
                  Apply for a Loan <ArrowRight size={20} />
                </Button>
              </Link>
              <Link href="/register/mfi" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold w-full bg-transparent border-white/20 hover:bg-white/10">
                  Join as an Institution
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
