"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, Clock, FileText, Lock } from "lucide-react";

const problems = [
  {
    icon: <Clock className="text-red-500" />,
    title: "Long Processing Times",
    description: "Traditional loan approvals can take weeks of manual verification and bank visits.",
  },
  {
    icon: <FileText className="text-red-500" />,
    title: "Complex Documentation",
    description: "Endless paperwork and physical document submission make it difficult for rural entrepreneurs.",
  },
  {
    icon: <AlertCircle className="text-red-500" />,
    title: "Lack of Transparency",
    description: "Applicants often have no way to track their loan status or understand rejection reasons.",
  },
  {
    icon: <Lock className="text-red-500" />,
    title: "Limited Access",
    description: "Many deserving small businesses are excluded due to lack of connection to institutions.",
  },
];

export default function ProblemPainPoints() {
  return (
    <section className="py-24 bg-red-50/30 dark:bg-red-950/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            The Challenges of <span className="text-red-500">Traditional</span> Microfinance
          </h2>
          <p className="text-lg text-muted-foreground">
            Before finBridge, the gap between entrepreneurs and capital was filled with obstacles.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-8 bg-background border rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {problem.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{problem.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
