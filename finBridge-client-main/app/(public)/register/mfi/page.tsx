"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, User, Mail, Phone, Lock, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const mfiRegistrationSchema = z.object({
  // Step 1: Personal Info
  name: z.string().min(3, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(11, "Valid phone number required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  
  // Step 2: MFI Info
  mfi_name: z.string().min(3, "MFI name is required"),
  mfi_email: z.string().email("Invalid MFI email address"),
  mfi_phone: z.string().min(11, "Valid MFI phone number required"),
});

type MFIRegistrationValues = z.infer<typeof mfiRegistrationSchema>;

export default function MFIRegister() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<MFIRegistrationValues>({
    resolver: zodResolver(mfiRegistrationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      mfi_name: "",
      mfi_email: "",
      mfi_phone: "",
    },
  });

  const nextStep = async () => {
    const fields = currentStep === 1 
      ? ["name", "email", "phone", "password"] 
      : ["mfi_name", "mfi_email", "mfi_phone"];
    
    const isValid = await form.trigger(fields as any);
    if (isValid) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  async function onSubmit(values: MFIRegistrationValues) {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/register/mfi", values);
      toast.success("MFI Registration successful!");
      setIsSuccess(true);
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-primary/5">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-md p-12 bg-background border rounded-[3rem] shadow-2xl"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <CheckCircle2 size={64} />
          </div>
          <h2 className="text-3xl font-bold text-primary">Success!</h2>
          <p className="text-muted-foreground text-lg">
            Your MFI institution registration request has been submitted. Our team will verify your details soon.
          </p>
          <Link 
            href="/login" 
            className={cn(buttonVariants(), "w-full h-14 rounded-2xl text-lg font-bold")}
          >
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">MFI Registration</h1>
          <p className="text-muted-foreground text-lg">Partner with us to empower entrepreneurs across Bangladesh.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all border-2",
            currentStep >= 1 ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-110" : "bg-muted border-muted text-muted-foreground"
          )}>
            1
          </div>
          <div className={cn("h-1 w-12 rounded-full", currentStep >= 2 ? "bg-primary" : "bg-muted")} />
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all border-2",
            currentStep >= 2 ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-110" : "bg-muted border-muted text-muted-foreground"
          )}>
            2
          </div>
        </div>

        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-background border rounded-[2.5rem] p-8 md:p-12 shadow-xl"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <User size={20} />
                      </div>
                      <h3 className="text-2xl font-bold">Account Owner Info</h3>
                    </div>

                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Owner" {...field} className="h-14 rounded-2xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personal Email</FormLabel>
                          <FormControl>
                            <Input placeholder="owner@mfi.com" {...field} className="h-14 rounded-2xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personal Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="017XXXXXXXX" {...field} className="h-14 rounded-2xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="h-14 rounded-2xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                        <Landmark size={20} />
                      </div>
                      <h3 className="text-2xl font-bold">Institution Details</h3>
                    </div>

                    <FormField control={form.control} name="mfi_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>MFI Name</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Microfinance" {...field} className="h-14 rounded-2xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="mfi_email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>MFI Official Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@abc.com" {...field} className="h-14 rounded-2xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="mfi_phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>MFI Official Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="017XXXXXXXX" {...field} className="h-14 rounded-2xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                {currentStep > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-14 rounded-2xl text-lg font-bold sm:w-1/3" 
                    onClick={prevStep}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="mr-2" /> Back
                  </Button>
                )}
                
                {currentStep < 2 ? (
                  <Button 
                    type="button" 
                    className="h-14 rounded-2xl text-lg font-bold flex-1" 
                    onClick={nextStep}
                  >
                    Next Step <ArrowRight className="ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="h-14 rounded-2xl text-lg font-bold flex-1 bg-secondary hover:bg-secondary/90 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" />
                        Registering...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </motion.div>
        
        <div className="mt-8 text-center">
          <p className="text-muted-foreground font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
