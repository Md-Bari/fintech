"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle, PhoneCall, ArrowDown } from "lucide-react";

const timelineSteps = [
  {
    id: 1,
    title: "MFI Lists Loan Products",
    description: "Microfinance Institutions (MFIs) register on the platform and create loan products with specific terms, amounts, and interest rates.",
    icon: FileText,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: 2,
    title: "Entrepreneur Applies",
    description: "Entrepreneurs browse the available loan products and apply directly by submitting their required business documents.",
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: 3,
    title: "MFI Review & Decision",
    description: "The targeted Microfinance Institution receives the application, reviews the submitted documents, and decides whether to Approve or Reject the request.",
    icon: CheckCircle,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: 4,
    title: "Disbursement & Contact",
    description: "If approved, the MFI institution will contact the entrepreneur directly using their provided details to finalize the agreement and disburse the funds.",
    icon: PhoneCall,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight"
          >
            How <span className="text-primary italic">finBridge</span> Works
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            A simple, transparent timeline connecting ambitious entrepreneurs with trusted microfinance institutions.
          </motion.p>
        </div>

        <div className="relative border-l-2 border-primary/20 ml-6 md:ml-12 space-y-12 pb-12">
          {timelineSteps.map((step, index) => (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative pl-8 md:pl-16"
            >
              {/* Timeline Dot/Icon */}
              <div className={`absolute -left-[25px] top-0 w-12 h-12 rounded-full border-4 border-background ${step.bgColor} ${step.color} flex items-center justify-center shadow-xl`}>
                <step.icon size={20} />
              </div>

              {/* Content Card */}
              <div className="bg-background border shadow-lg rounded-2xl p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl font-extrabold text-muted/30 select-none">
                    0{step.id}
                  </span>
                  <h3 className="text-2xl font-bold">{step.title}</h3>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connecting Arrow (except last) */}
              {index < timelineSteps.length - 1 && (
                <div className="hidden md:block absolute -bottom-10 left-[-11px] text-primary/30">
                  <ArrowDown size={20} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center p-8 rounded-3xl bg-primary/10 border border-primary/20"
        >
          <h2 className="text-2xl font-bold mb-2">Ready to grow your business?</h2>
          <p className="text-muted-foreground">Register as an entrepreneur today and explore available loans.</p>
        </motion.div>
      </div>
    </div>
  );
}
