"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  Search, 
  Smartphone, 
  ShieldCheck, 
  BarChart, 
  FileCheck 
} from "lucide-react";

const features = [
  {
    role: "Entrepreneur",
    title: "Direct Bridge",
    description: "Access microfinance directly without any middle-men or hidden fees.",
    icon: <Briefcase className="text-primary" />,
    bg: "bg-primary/5",
  },
  {
    role: "Entrepreneur",
    title: "Marketplace Search",
    description: "Compare multiple MFI loan products based on interest rates and terms.",
    icon: <Search className="text-primary" />,
    bg: "bg-primary/5",
  },
  {
    role: "Entrepreneur",
    title: "Mobile First",
    description: "Apply and track your status from your smartphone anywhere in the country.",
    icon: <Smartphone className="text-primary" />,
    bg: "bg-primary/5",
  },
  {
    role: "MFI Institution",
    title: "Secure Onboarding",
    description: "Verify applicants quickly with secure access to digital identity documents.",
    icon: <ShieldCheck className="text-secondary" />,
    bg: "bg-secondary/5",
  },
  {
    role: "MFI Institution",
    title: "Deep Analytics",
    description: "Gain insights into your application pipeline and product performance.",
    icon: <BarChart className="text-secondary" />,
    bg: "bg-secondary/5",
  },
  {
    role: "MFI Institution",
    title: "Digital Workflow",
    description: "Manage applications through a seamless approval/rejection pipeline.",
    icon: <FileCheck className="text-secondary" />,
    bg: "bg-secondary/5",
  },
];

export default function FeaturesGrid() {
  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-950/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Designed for <span className="text-primary">Everyone</span> in the Ecosystem
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you are a borrower or a lender, finBridge provides the tools you need to succeed.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`p-8 rounded-[2rem] border bg-background hover:shadow-xl transition-all duration-300 group relative overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${feature.bg} rounded-bl-[100px] -mr-16 -mt-16 transition-transform group-hover:scale-150`} />
              
              <div className="relative z-10 space-y-6">
                <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center`}>
                  {feature.icon}
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${feature.role === 'Entrepreneur' ? 'text-primary' : 'text-secondary'}`}>
                    {feature.role}
                  </p>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
