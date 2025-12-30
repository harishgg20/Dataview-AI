"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, Activity, Settings, Database, Shield, Loader2 } from "lucide-react";
import { authService } from "@/services/auth";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        authService.getProfile().then(user => {
            if (user.role !== "admin") {
                router.push("/dashboard");
            } else {
                setAuthorized(true);
            }
        }).catch(() => {
            router.push("/login");
        }).finally(() => {
            setIsLoading(false);
        });
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-gray-100 flex" suppressHydrationWarning>
            {/* Admin Sidebar */}
            <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col gap-4" suppressHydrationWarning>
                <div className="flex items-center gap-2 px-2 py-4 border-b border-slate-700">
                    <Shield className="w-6 h-6 text-red-500" />
                    <span className="font-bold text-lg">Admin Panel</span>
                </div>

                <nav className="flex flex-col gap-1" suppressHydrationWarning>
                    <Link
                        href="/admin/overview"
                        suppressHydrationWarning
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
                    >
                        <Activity className="w-5 h-5" />
                        Overview
                    </Link>
                    <Link
                        href="/admin/users"
                        suppressHydrationWarning
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
                    >
                        <Users className="w-5 h-5" />
                        Users
                    </Link>
                    <Link
                        href="/admin/data"
                        suppressHydrationWarning
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
                    >
                        <Database className="w-5 h-5" />
                        Data Sources
                    </Link>
                    <Link
                        href="/admin/settings"
                        suppressHydrationWarning
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </Link>
                </nav>
            </aside>

            <main className="flex-1 p-8" suppressHydrationWarning>
                {children}
            </main>
        </div>
    );
}
