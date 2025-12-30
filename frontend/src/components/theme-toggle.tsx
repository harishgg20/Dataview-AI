"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-32 p-0">
                <div className="flex flex-col">
                    <Button variant="ghost" className="justify-start rounded-none" onClick={() => setTheme("light")}>
                        Light
                    </Button>
                    <Button variant="ghost" className="justify-start rounded-none" onClick={() => setTheme("dark")}>
                        Dark
                    </Button>
                    <Button variant="ghost" className="justify-start rounded-none" onClick={() => setTheme("system")}>
                        System
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
