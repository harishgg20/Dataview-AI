"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";

import { cn } from "@/lib/utils";

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
            <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
            <main
                suppressHydrationWarning
                className={cn(
                    "min-h-screen p-6 transition-all duration-300 ease-in-out",
                    isCollapsed ? "md:ml-[70px]" : "md:ml-[240px]"
                )}
            >
                {children}
            </main>
        </div>
    );
}
