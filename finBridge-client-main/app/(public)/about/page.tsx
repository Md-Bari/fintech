import React from "react";
import { Users, Target, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";

export const metadata = {
  title: "About Us | finBridge",
  description: "Learn more about finBridge and our mission to empower microfinance in Bangladesh.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-muted/20">
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* Header Section */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            About <span className="text-primary italic">finBridge</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We are dedicated to revolutionizing the microfinance landscape in Bangladesh by connecting passionate entrepreneurs with verified, trusted Microfinance Institutions (MFIs).
          </p>
        </div>

        {/* Mission & Vision Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-background border shadow-lg rounded-2xl p-8 space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Target size={24} />
            </div>
            <h2 className="text-2xl font-bold">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              To dismantle the barriers to financial access by providing a seamless, transparent, and efficient platform where small businesses can easily discover and apply for micro-loans tailored to their unique needs.
            </p>
          </div>
          <div className="bg-background border shadow-lg rounded-2xl p-8 space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
              <Zap size={24} />
            </div>
            <h2 className="text-2xl font-bold">Our Vision</h2>
            <p className="text-muted-foreground leading-relaxed">
              A Bangladesh where every aspiring entrepreneur, regardless of background, has the immediate financial backing they need to scale their businesses, sustain their communities, and drive the national economy forward.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Our Core Values</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex gap-4 items-start p-6 rounded-2xl bg-muted/50">
              <ShieldCheck className="text-emerald-500 shrink-0" size={28} />
              <div>
                <h3 className="font-bold text-lg mb-2">Transparency & Trust</h3>
                <p className="text-muted-foreground text-sm">We ensure that all MFI terms are clearly listed. No hidden fees, no confusing jargon. What you see is exactly what you get.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-6 rounded-2xl bg-muted/50">
              <Users className="text-blue-500 shrink-0" size={28} />
              <div>
                <h3 className="font-bold text-lg mb-2">Community Empowerment</h3>
                <p className="text-muted-foreground text-sm">We believe in the power of the local entrepreneur. By funding local businesses, we directly contribute to community wealth generation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 space-y-6 text-center">
          <h2 className="text-3xl font-bold">Our Story</h2>
          <p className="text-primary-foreground/90 leading-relaxed max-w-3xl mx-auto text-lg">
            finBridge was born out of a simple observation: while there are countless hard-working entrepreneurs in Bangladesh with brilliant ideas, the process of securing a micro-loan is often fragmented, overly bureaucratic, and intimidating. We built finBridge to be the digital bridge that eliminates the friction between capital providers and capital seekers. 
          </p>
        </div>

      </div>
    </div>
  );
}
