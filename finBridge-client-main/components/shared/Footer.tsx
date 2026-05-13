import React from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Company Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-primary font-bold text-xl">FB</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">
              finBridge
            </span>
          </div>
          <p className="text-primary-foreground/80 leading-relaxed">
            Empowering small businesses and entrepreneurs across Bangladesh through accessible microfinance solutions. 
            Bridging the gap between MFIs and applicants.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-accent transition-colors"><Facebook size={20} /></Link>
            <Link href="#" className="hover:text-accent transition-colors"><Twitter size={20} /></Link>
            <Link href="#" className="hover:text-accent transition-colors"><Instagram size={20} /></Link>
            <Link href="#" className="hover:text-accent transition-colors"><Linkedin size={20} /></Link>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-bold mb-6">Quick Links</h4>
          <ul className="space-y-4 text-primary-foreground/80">
            <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
            <li><Link href="/loans" className="hover:text-accent transition-colors">Find Loans</Link></li>
            <li><Link href="/how-it-works" className="hover:text-accent transition-colors">How It Works</Link></li>
            <li><Link href="/about" className="hover:text-accent transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* For Users */}
        <div>
          <h4 className="text-lg font-bold mb-6">For Users</h4>
          <ul className="space-y-4 text-primary-foreground/80">
            <li><Link href="/login" className="hover:text-accent transition-colors">Login</Link></li>
            <li><Link href="/register/entrepreneur" className="hover:text-accent transition-colors">Register as Entrepreneur</Link></li>
            <li><Link href="/register/mfi" className="hover:text-accent transition-colors">Register as MFI</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-lg font-bold mb-6">Contact Us</h4>
          <ul className="space-y-4 text-primary-foreground/80">
            <li className="flex items-center gap-3">
              <MapPin size={18} className="text-accent" />
              <span>Gulshan 2, Dhaka, Bangladesh</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-accent" />
              <span>+880 1234 567890</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-accent" />
              <span>info@finbridge.com.bd</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-20 pt-8 border-t border-primary-foreground/20 text-center text-primary-foreground/60 text-sm">
        <p>&copy; {new Date().getFullYear()} finBridge. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-4">
          <Dialog>
            <DialogTrigger render={<button className="hover:text-accent transition-colors" />}>
              Privacy Policy
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold mb-2">Privacy Policy</DialogTitle>
                <DialogDescription>
                  Effective Date: {new Date().toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-foreground/80 mt-4 leading-relaxed">
                <p>Welcome to finBridge. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.</p>
                <h3 className="text-lg font-bold text-foreground">1. Information We Collect</h3>
                <p>We collect personal information that you voluntarily provide to us when registering at the finBridge platform expressing an interest in obtaining information about us or our products and services. The personal information that we collect depends on the context of your interactions with us and the App, the choices you make and the products and features you use.</p>
                <h3 className="text-lg font-bold text-foreground">2. How We Use Your Information</h3>
                <p>We use personal information collected via our App for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
                <h3 className="text-lg font-bold text-foreground">3. Information Sharing</h3>
                <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. Specifically, entrepreneur application details are shared exclusively with the Microfinance Institutions (MFIs) they apply to.</p>
                <h3 className="text-lg font-bold text-foreground">4. Data Security</h3>
                <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.</p>
              </div>
              <DialogFooter className="mt-6">
                <DialogClose render={<Button variant="outline" />}>
                  I Understand
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={<button className="hover:text-accent transition-colors" />}>
              Terms of Service
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold mb-2">Terms of Service</DialogTitle>
                <DialogDescription>
                  Effective Date: {new Date().toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-foreground/80 mt-4 leading-relaxed">
                <p>These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and finBridge (“we,” “us” or “our”), concerning your access to and use of our platform.</p>
                <h3 className="text-lg font-bold text-foreground">1. Agreement to Terms</h3>
                <p>By accessing the platform, you agree that you have read, understood, and agree to be bound by all of these Terms of Service. If you do not agree with all of these Terms of Service, then you are expressly prohibited from using the platform and you must discontinue use immediately.</p>
                <h3 className="text-lg font-bold text-foreground">2. User Representations</h3>
                <p>By using the platform, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information; (3) you have the legal capacity to enter into agreements.</p>
                <h3 className="text-lg font-bold text-foreground">3. Platform Role</h3>
                <p>finBridge is a facilitator that connects entrepreneurs with Microfinance Institutions. We do not provide loans directly, nor do we guarantee the approval of any loan application. All loan agreements are strictly between the entrepreneur and the MFI.</p>
                <h3 className="text-lg font-bold text-foreground">4. User Data & Verification</h3>
                <p>MFIs are responsible for independently verifying the claims and documents submitted by entrepreneurs before disbursing any funds. finBridge is not liable for falsified documents or defaulted payments.</p>
              </div>
              <DialogFooter className="mt-6">
                <DialogClose render={<Button variant="outline" />}>
                  I Agree
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </footer>
  );
}
