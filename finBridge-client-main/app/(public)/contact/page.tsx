"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-muted/20">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight"
          >
            Get in <span className="text-primary italic">Touch</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Have a question, need technical support, or want to partner with us? Our team is here to help you navigate your microfinance journey.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          
          {/* Contact Information Cards */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-background border shadow-lg rounded-2xl p-6 flex items-start gap-4 hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Our Headquarters</h3>
                <p className="text-muted-foreground mt-1">Gulshan 2, Dhaka 1212<br/>Bangladesh</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-background border shadow-lg rounded-2xl p-6 flex items-start gap-4 hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Call Us Directly</h3>
                <p className="text-muted-foreground mt-1">+880 1234 567890<br/>Mon-Fri, 9am - 6pm</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-background border shadow-lg rounded-2xl p-6 flex items-start gap-4 hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Email Support</h3>
                <p className="text-muted-foreground mt-1">info@finbridge.com.bd<br/>support@finbridge.com.bd</p>
              </div>
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-background border shadow-2xl rounded-3xl p-8 md:p-12"
          >
            <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full h-12 px-4 rounded-xl border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full h-12 px-4 rounded-xl border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <input 
                  type="text" 
                  className="w-full h-12 px-4 rounded-xl border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                  placeholder="How can we help you?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea 
                  className="w-full min-h-[150px] p-4 rounded-xl border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all resize-none"
                  placeholder="Tell us about your inquiry..."
                ></textarea>
              </div>
              <Button size="lg" className="w-full h-14 rounded-xl text-lg gap-2">
                <Send size={20} />
                Send Message
              </Button>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
