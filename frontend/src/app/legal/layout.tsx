"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Scale, Lock, Shield, FileText, ArrowLeft } from "lucide-react";

const sidebarItems = [
    { name: "Privacy Policy", href: "/legal/privacy", icon: Lock },
    { name: "Terms of Service", href: "/legal/terms", icon: Scale },
    { name: "Cookie Policy", href: "/legal/cookies", icon: Shield },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Simple Header */}
            <header className="bg-white border-b px-6 h-16 flex items-center justify-between sticky top-0 z-30">
                <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
                </Link>
                <div className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Legal Center
                </div>
                <div className="w-[100px]"></div> {/* Spacer for balance */}
            </header>

            <div className="container mx-auto max-w-6xl flex-1 flex flex-col md:flex-row gap-8 py-8 px-4">
                {/* Sidebar */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <nav className="flex flex-col gap-1 sticky top-24">
                        {sidebarItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-blue-50 text-blue-700 border-blue-200 border"
                                            : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm"
                                    )}
                                >
                                    <item.icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-gray-400")} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 bg-white rounded-xl shadow-sm border p-8 md:p-12 min-h-[500px]">
                    {children}
                </main>
            </div>

            {/* Simple Footer */}
            <footer className="py-6 text-center text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Analytics Platform. All rights reserved.
            </footer>
        </div>
    );
}
