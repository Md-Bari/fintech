"use client";

import React, { useEffect, useState, use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, CheckCircle2, Loader2, Building2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface InvoiceData {
  invoice_id: string;
  transaction_id: string;
  plan_name: string;
  amount: number;
  status: string;
  date: string;
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/mfi/invoice/${id}`);
        setInvoice(res.data?.data || null);
      } catch (err) {
        console.error("Failed to fetch invoice", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading invoice details…</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2">
          <Building2 size={24} />
        </div>
        <h2 className="text-xl font-bold">Invoice Not Found</h2>
        <p className="text-muted-foreground text-sm max-w-xs">The requested invoice could not be located or you don't have permission to view it.</p>
        <Link href="/mfi/payments">
          <Button variant="outline" className="mt-4 rounded-xl">Return to Payments</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-3xl mx-auto">
      {/* Non-printable header actions */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/mfi/payments" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Payments
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={handlePrint}>
            <Printer size={16} /> Print
          </Button>
          <Button size="sm" className="gap-2 rounded-xl" onClick={handlePrint}>
            <Download size={16} /> Save PDF
          </Button>
        </div>
      </div>

      {/* Printable Invoice Card */}
      <Card className="rounded-[2rem] border-none shadow-xl print:shadow-none print:border print:rounded-none overflow-hidden bg-white text-black">
        {/* Decorative Top Bar */}
        <div className="h-3 w-full bg-primary print:hidden" />
        
        <CardContent className="p-8 md:p-12 space-y-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 pb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0 print:bg-black">
                <span className="text-white font-bold text-2xl">FB</span>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">finBridge</h1>
                <p className="text-sm text-gray-500 font-medium tracking-wide">MFI Solutions Platform</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <h2 className="text-3xl font-extrabold text-gray-200 uppercase tracking-widest mb-1 print:text-gray-400">Invoice</h2>
              <p className="font-mono font-bold text-gray-900">{invoice.invoice_id}</p>
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</p>
              <h3 className="text-lg font-bold text-gray-900">MFI Administrator</h3>
              <p className="text-sm text-gray-500 mt-1">finBridge registered institution</p>
            </div>
            <div className="sm:text-right space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Issue</p>
                <p className="font-medium text-gray-900">
                  {new Date(invoice.date).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Transaction ID</p>
                <p className="font-mono text-sm text-gray-600 break-all">{invoice.transaction_id}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mt-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-y-2 border-gray-100">
                  <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-6">
                    <p className="font-bold text-gray-900 text-lg">finBridge {invoice.plan_name} Plan</p>
                    <p className="text-sm text-gray-500 mt-1">Subscription fee</p>
                  </td>
                  <td className="py-6 text-right font-bold text-gray-900 text-lg">
                    ৳ {invoice.amount.toLocaleString()}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-100">
                  <td className="py-6 text-right font-bold text-gray-500 uppercase tracking-wider text-sm">Total Paid</td>
                  <td className="py-6 text-right font-extrabold text-primary text-3xl print:text-black">
                    ৳ {invoice.amount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer / Status */}
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            {invoice.status === "success" && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg print:border print:border-emerald-200">
                <CheckCircle2 size={20} />
                <span className="font-bold tracking-wide">PAYMENT SUCCESSFUL</span>
              </div>
            )}
            <p className="text-xs text-gray-400 text-center md:text-right">
              Thank you for using finBridge.<br/>If you have any questions concerning this invoice, contact support.
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
