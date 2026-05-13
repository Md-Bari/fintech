import React from "react";
import Hero from "@/components/home/Hero";
import ProblemPainPoints from "@/components/home/ProblemPainPoints";
import SolutionOverview from "@/components/home/SolutionOverview";
import HowItWorks from "@/components/home/HowItWorks";
import FeaturesGrid from "@/components/home/FeaturesGrid";
import PlatformStats from "@/components/home/PlatformStats";
import FeaturedLoans from "@/components/home/FeaturedLoans";
import SubscriptionPlans from "@/components/home/SubscriptionPlans";
import Testimonials from "@/components/home/Testimonials";
import FAQ from "@/components/home/FAQ";
import FinalCTA from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <ProblemPainPoints />
      <SolutionOverview />
      <HowItWorks />
      <PlatformStats />
      <FeaturesGrid />
      <FeaturedLoans />
      <SubscriptionPlans />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </div>
  );
}

