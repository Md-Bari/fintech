"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

const steps = [
  { id: 1, title: "Personal Details", icon: User },
  { id: 2, title: "Security", icon: Lock },
];

const registrationSchema = z.object({
  name: z.string().min(3, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(11, "Valid phone number required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function EntrepreneurRegister() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "", email: "", phone: "",
      password: "", confirmPassword: "",
    },
  });

  const nextStep = async () => {
    const fields = currentStep === 1 
      ? ["name", "email", "phone"] 
      : ["password", "confirmPassword"];
    
    const isValid = await form.trigger(fields as any);
    if (isValid) setCurrentStep(prev => Math.min(prev + 1, 2));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  async function onSubmit(values: z.infer<typeof registrationSchema>) {
    setIsLoading(true);
    try {
      // Send only the required fields to the API
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      };
      await api.post("/auth/register/entrepreneur", payload);
      toast.success("Registration successful!");
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-md p-12 bg-background border rounded-[3rem] shadow-2xl"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <CheckCircle2 size={64} />
          </div>
          <h2 className="text-3xl font-bold">Registration Successful!</h2>
          <p className="text-muted-foreground">
            Your entrepreneur profile has been created. You can now login and explore loan options.
          </p>
          <Link 
            href="/login" 
            className={cn(buttonVariants(), "w-full h-12 rounded-xl flex items-center justify-center")}
          >
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -z-10" />
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  currentStep >= step.id ? "bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-background border-muted text-muted-foreground"
                }`}>
                  <step.icon size={20} />
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${currentStep >= step.id ? "text-primary" : "text-muted-foreground"}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-background border rounded-[2.5rem] p-10 shadow-xl"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold">Tell us about yourself</h3>
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} className="h-12 rounded-xl" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl><Input placeholder="john@example.com" {...field} className="h-12 rounded-xl" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input placeholder="018XXXXXXXX" {...field} className="h-12 rounded-xl" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold">Secure your account</h3>
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} className="h-12 rounded-xl" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} className="h-12 rounded-xl" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}
              </AnimatePresence>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" className="h-12 rounded-xl gap-2 sm:w-1/3" onClick={prevStep}>
                    <ArrowLeft size={18} /> Previous
                  </Button>
                )}
                {currentStep < 2 ? (
                  <Button type="button" className="h-12 rounded-xl gap-2 flex-1" onClick={nextStep}>
                    Next <ArrowRight size={18} />
                  </Button>
                ) : (
                  <Button type="submit" className="h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} />
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
      </div>
    </div>
  );
}
