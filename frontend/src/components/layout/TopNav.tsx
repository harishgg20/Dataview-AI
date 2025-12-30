"use client";

import Link from "next/link";
import { UserCircle, LogOut, User, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "next/navigation";

export function TopNav() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    return (
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-10" suppressHydrationWarning>
            <div className="flex items-center gap-4">
                <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    My Workspace
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="text-gray-500 hover:text-gray-700 outline-none transition-colors" suppressHydrationWarning>
                            <UserCircle className="w-8 h-8" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-56 p-2">
                        <div className="px-2 py-1.5 text-sm font-semibold text-gray-900 border-b mb-1">
                            My Account
                        </div>

                        <div className="space-y-1">
                            <button
                                onClick={() => router.push("/settings")}
                                className="w-full text-left flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            >
                                <User className="w-4 h-4" />
                                Profile
                            </button>
                            <button
                                onClick={() => router.push("/settings")}
                                className="w-full text-left flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>
                            <div className="h-px bg-gray-200 my-1" />
                            <button
                                onClick={handleLogout}
                                className="w-full text-left flex items-center gap-2 px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign out
                            </button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </header>
    );
}
