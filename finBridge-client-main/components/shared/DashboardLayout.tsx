"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, 
  LogOut, 
  Menu, 
  Bell,
  Landmark,
  ClipboardList,
  CreditCard,
  BadgeCheck,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { useAppStore } from "@/store/app.store";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "ENTREPRENEUR" | "MFI_ADMIN" | "PLATFORM_ADMIN";
}

const menuItems = {
  ENTREPRENEUR: [
    { name: "Profile", href: "/entrepreneur", icon: User },
  ],
  MFI_ADMIN: [
    { name: "Profile", href: "/mfi", icon: User },
    { name: "Loan Products", href: "/mfi/loan-products", icon: Landmark },
    { name: "Applications", href: "/mfi/applications", icon: ClipboardList },
    { name: "Payments", href: "/mfi/payments", icon: CreditCard },
    { name: "My Subscription", href: "/mfi/subscription", icon: BadgeCheck },
  ],
  PLATFORM_ADMIN: [
    { name: "Profile", href: "/admin", icon: User },
    { name: "MFIs", href: "/admin/mfis", icon: Landmark },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Applications", href: "/admin/applications", icon: ClipboardList },
    { name: "Revenue Report", href: "/admin/reports/revenue", icon: TrendingUp },
    { name: "Subscription Plans", href: "/admin/subscription-plans", icon: BadgeCheck },
  ],
};

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  const items = menuItems[role];

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-full bg-background border-r transition-all duration-300 z-40",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <Link href="/" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-xl">FB</span>
          </div>
          {sidebarOpen && <span className="font-bold text-xl tracking-tight">finBridge</span>}
        </Link>

        <nav className="mt-8 px-4 space-y-2 flex flex-col items-center sm:items-stretch">
          {items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center h-12 rounded-xl transition-colors",
                sidebarOpen ? "justify-start px-4 gap-3 w-full" : "justify-center w-12",
                pathname === item.href 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-8 w-full px-4 flex flex-col items-center sm:items-stretch">
          <Button 
            variant="ghost" 
            className={cn(
              "h-12 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors",
              sidebarOpen ? "justify-start px-4 gap-3 w-full" : "justify-center w-12 px-0"
            )}
            onClick={logout}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-20"
      )}>
        {/* Top Header */}
        <header className="h-20 bg-background border-b flex items-center justify-between px-8 sticky top-0 z-30">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu />
          </Button>

          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{user?.name || "User Name"}</p>
                <p className="text-xs text-muted-foreground capitalize">{role.replace("_", " ").toLowerCase()}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {user?.name?.[0] || "U"}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
