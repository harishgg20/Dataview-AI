"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, PieChart, Lightbulb, Activity, Settings, Shield } from "lucide-react";
import { authService } from "@/services/auth";

const navItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Analyses", href: "/analysis", icon: FileText },
    { name: "Dashboards", href: "/dashboards", icon: PieChart },
    { name: "Insights", href: "/insights", icon: Lightbulb },
    { name: "Monitoring", href: "/monitoring", icon: Activity },
    { name: "Admin", href: "/admin", icon: Shield },
    { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        authService.getProfile().then(user => {
            setRole(user.role);
        }).catch(() => {
            // If fetch fails, assume not admin
            setRole("viewer");
        });
    }, []);

    const filteredNavItems = navItems.filter(item => {
        if (item.name === "Admin") {
            return role === "admin";
        }
        return true;
    });

    return (
        <aside
            suppressHydrationWarning
            className={cn(
                "flex-shrink-0 border-r bg-white h-screen fixed left-0 top-0 pt-16 hidden md:block transition-all duration-300",
                isCollapsed ? "w-[70px]" : "w-[240px]"
            )}
        >
            <div className="flex flex-col gap-2 p-4" suppressHydrationWarning>
                <div className={cn("mb-4 flex items-center gap-2", isCollapsed ? "justify-center" : "px-2")}>
                    <div className="bg-blue-600 text-white p-1 rounded-md flex-shrink-0">
                        <Activity className="w-6 h-6" />
                    </div>
                    <span className={cn("font-bold text-lg text-blue-900 transition-opacity duration-300 whitespace-nowrap", isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
                        Analytics
                    </span>
                </div>
                {filteredNavItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors overflow-hidden",
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                            title={isCollapsed ? item.name : undefined}
                            suppressHydrationWarning
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className={cn("transition-opacity duration-300", isCollapsed ? "opacity-0 w-0" : "opacity-100")}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* Removed Collapse Button */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-20 bg-white border rounded-full p-1 shadow-sm hover:bg-gray-50 z-50 text-gray-500"
                suppressHydrationWarning
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform", isCollapsed && "rotate-180")}>
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>
        </aside>
    );
}
