"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "What documents do I need to apply?",
    answer: "Generally, you will need a valid National ID (NID), a recent photo, and your Trade License or TIN if applicable. Requirements may vary slightly depending on the MFI.",
  },
  {
    question: "How long does the approval process take?",
    answer: "Digital applications through finBridge are typically reviewed within 24-48 hours. Once pre-approved, the final disbursement usually takes 3-5 working days.",
  },
  {
    question: "Is my personal data safe?",
    answer: "Yes, we use bank-grade encryption to protect your data. Your information is only shared with the specific MFI you choose to apply to.",
  },
  {
    question: "Can I apply for multiple loans at once?",
    answer: "We recommend applying for one loan at a time to maintain a healthy credit score and increase your chances of approval.",
  },
  {
    question: "Are there any service fees for entrepreneurs?",
    answer: "finBridge is free for entrepreneurs to search and apply. We charge MFIs a small platform fee to maintain the digital infrastructure.",
  },
];

export default function FAQ() {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-primary italic underline decoration-secondary/30">Common Questions</h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about the finBridge ecosystem.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion className="w-full space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border rounded-2xl px-6 bg-background shadow-sm overflow-hidden">
                <AccordionTrigger className="text-left font-bold text-lg py-6 hover:text-primary hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
