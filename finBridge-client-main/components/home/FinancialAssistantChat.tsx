"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

type ChatMsg = { role: "user" | "assistant"; content: string };
type Step = "loan_type" | "amount" | "duration" | "purpose" | "income" | "done";
type LoanProduct = {
  id: string;
  mfi_id: string;
  name: string;
  description?: string | null;
  min_amount?: number | null;
  max_amount?: number | null;
  interest_rate?: number | null;
  duration_months?: number | null;
  mfi_name?: string;
};

type Profile = {
  loanType?: string;
  amount?: number;
  duration?: number;
  purpose?: string;
  income?: number;
};

const START_MESSAGE =
  "Hi, I am your financial assistant. First, what type of loan do you want? (business, personal, education, medical, home, agriculture)";

export default function FinancialAssistantChat() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [step, setStep] = useState<Step>("loan_type");
  const [profile, setProfile] = useState<Profile>({});
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [suggestions, setSuggestions] = useState<LoanProduct[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: START_MESSAGE,
    },
  ]);

  useEffect(() => {
    if (!open || products.length > 0) return;
    (async () => {
      try {
        const res = await api.get("/loan-products");
        const list = (res?.data?.data ?? []) as LoanProduct[];
        setProducts(list);
      } catch {
        setProducts([]);
      }
    })();
  }, [open, products.length]);

  const parseLoanType = (value: string) => {
    const v = value.toLowerCase();
    if (["hi", "hello", "hey", "assalamu alaikum", "salam"].some((g) => v.includes(g))) return null;
    if (v.includes("business") || v.includes("shop") || v.includes("trade")) return "business";
    if (v.includes("personal")) return "personal";
    if (v.includes("education") || v.includes("study") || v.includes("student")) return "education";
    if (v.includes("medical") || v.includes("health")) return "medical";
    if (v.includes("home") || v.includes("house")) return "home";
    if (v.includes("agri") || v.includes("farm")) return "agriculture";
    return null;
  };

  const parseNumber = (value: string): number | null => {
    const only = value.replace(/[^\d.]/g, "");
    const n = Number(only);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  };

  const assistantPush = (content: string) => {
    setMessages((prev) => [...prev, { role: "assistant", content }]);
  };

  const formatMoney = (v?: number | null) =>
    typeof v === "number" ? `৳ ${Math.round(v).toLocaleString("en-BD")}` : "N/A";

  const recommend = (p: Profile) => {
    const ranked = [...products]
      .map((x) => {
        let score = 0;
        const name = `${x.name || ""} ${x.description || ""}`.toLowerCase();
        if (p.loanType && name.includes(p.loanType.toLowerCase())) score += 3;
        if (p.amount && x.min_amount !== null && x.min_amount !== undefined && p.amount >= Number(x.min_amount)) score += 2;
        if (p.amount && x.max_amount !== null && x.max_amount !== undefined && p.amount <= Number(x.max_amount)) score += 3;
        if (p.duration && x.duration_months !== null && x.duration_months !== undefined) {
          const diff = Math.abs(Number(x.duration_months) - p.duration);
          if (diff <= 3) score += 2;
          else if (diff <= 6) score += 1;
        }
        if (x.interest_rate !== null && x.interest_rate !== undefined) score += Math.max(0, 2 - Number(x.interest_rate) / 20);
        return { item: x, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.item);

    setSuggestions(ranked);
    if (ranked.length === 0) {
      assistantPush("I could not find a close package. Please try a lower amount or different duration.");
      return;
    }

    const lines = ranked
      .map(
        (r, i) =>
          `${i + 1}. ${r.name} (${r.mfi_name}) - ${formatMoney(r.min_amount)} to ${formatMoney(r.max_amount)}, ${r.duration_months} months, ${r.interest_rate}% interest`
      )
      .join("\n");
    assistantPush(`Based on your answers, these packages match best:\n${lines}\nYou can click "Apply" below each package.`);
  };

  const send = async () => {
    const msg = text.trim();
    if (!msg || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setText("");

    if (step === "loan_type") {
      const loanType = parseLoanType(msg);
      if (!loanType) {
        assistantPush(
          "Great to meet you. Please choose one loan type so I can guide you better: business, personal, education, medical, home, or agriculture."
        );
        return;
      }
      setProfile((p) => ({ ...p, loanType }));
      setStep("amount");
      assistantPush(`Perfect, ${loanType} loan. Approximately how much do you need in BDT?`);
      return;
    }

    if (step === "amount") {
      const amount = parseNumber(msg);
      if (!amount) {
        assistantPush("Please enter a valid amount, like 50000.");
        return;
      }
      setProfile((p) => ({ ...p, amount }));
      setStep("duration");
      assistantPush("Thanks. What duration do you want in months?");
      return;
    }

    if (step === "duration") {
      const duration = parseNumber(msg);
      if (!duration) {
        assistantPush("Please enter a valid duration in months, like 12.");
        return;
      }
      setProfile((p) => ({ ...p, duration: Math.round(duration) }));
      setStep("purpose");
      assistantPush("What is the main purpose of this loan?");
      return;
    }

    if (step === "purpose") {
      const purpose = msg;
      setProfile((p) => ({ ...p, purpose }));
      setStep("income");
      assistantPush("Last question: what is your approximate monthly income in BDT?");
      return;
    }

    if (step === "income") {
      const income = parseNumber(msg);
      if (!income) {
        assistantPush("Please enter a valid monthly income, like 25000.");
        return;
      }
      const finalProfile = { ...profile, income };
      setProfile(finalProfile);
      setStep("done");
      recommend(finalProfile);
      return;
    }

    // after recommendations, keep free finance Q&A with backend assistant
    setLoading(true);
    try {
      const res = await api.post("/chat/financial-assistant", {
        message: msg,
        history: messages.slice(-10),
      });
      const reply = res?.data?.data?.reply || "I could not generate a response right now.";
      assistantPush(reply);
    } catch {
      assistantPush("Assistant is temporarily unavailable. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  const canRestart = useMemo(() => step !== "loan_type", [step]);
  const restartFlow = () => {
    setStep("loan_type");
    setProfile({});
    setSuggestions([]);
    setMessages([{ role: "assistant", content: START_MESSAGE }]);
    setText("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open ? (
        <Button className="rounded-full h-14 px-5 shadow-xl" onClick={() => setOpen(true)}>
          <MessageCircle size={18} className="mr-2" />
          Finance Chat
        </Button>
      ) : (
        <Card className="w-[340px] sm:w-[380px] shadow-2xl border-primary/20">
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Financial Assistant</CardTitle>
            <div className="flex items-center gap-1">
              {canRestart && (
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={restartFlow}>
                  Restart
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[320px] overflow-y-auto p-4 space-y-3 bg-muted/20">
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-background border"}`}>
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-background border">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking...
                </div>
              )}
              {step === "done" && suggestions.length > 0 && (
                <div className="space-y-2">
                  {suggestions.map((s) => (
                    <div key={s.id} className="rounded-xl border bg-background p-2 text-xs">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-muted-foreground">{s.mfi_name}</p>
                      <p className="text-muted-foreground">
                        {formatMoney(s.min_amount)} - {formatMoney(s.max_amount)} | {s.duration_months} months | {s.interest_rate}% interest
                      </p>
                      <Link
                        className="inline-block mt-1 text-primary underline"
                        href={`/apply-loan?mfi_id=${s.mfi_id}&loan_product_id=${s.id}`}
                      >
                        Apply
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t flex gap-2">
              <Input
                placeholder={step === "done" ? "Ask more finance questions..." : "Type your answer..."}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                disabled={loading}
              />
              <Button onClick={send} disabled={loading || !text.trim()} size="icon">
                <Send size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
