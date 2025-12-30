"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

const PopoverContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
} | undefined>(undefined)

const Popover = ({ children, open: controlledOpen, onOpenChange }: any) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
    const open = controlledOpen ?? uncontrolledOpen
    const setOpen = onOpenChange ?? setUncontrolledOpen

    return (
        <PopoverContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block">{children}</div>
        </PopoverContext.Provider>
    )
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
    ({ className, children, onClick, asChild = false, ...props }, ref) => {
        const { open, setOpen } = React.useContext(PopoverContext)!
        const Comp = asChild ? Slot : "button"

        return (
            <Comp
                ref={ref}
                type={asChild ? undefined : "button"}
                onClick={(e) => {
                    onClick && onClick(e);
                    setOpen(!open);
                }}
                className={cn(className)}
                {...props}
            >
                {children}
            </Comp>
        )
    }
)
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { align?: "center" | "start" | "end" }>(
    ({ className, align = "center", style, ...props }, ref) => {
        const { open, setOpen } = React.useContext(PopoverContext)!
        const contentRef = React.useRef<HTMLDivElement>(null)

        React.useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
                    setOpen(false)
                }
            }

            if (open) {
                setTimeout(() => document.addEventListener("mousedown", handleClickOutside), 0);
            }
            return () => document.removeEventListener("mousedown", handleClickOutside)
        }, [open, setOpen])

        if (!open) return null

        return (
            <div
                ref={contentRef}
                className={cn(
                    "absolute z-50 w-72 rounded-xl border border-slate-200 bg-white p-4 text-slate-950 shadow-xl outline-none animate-in fade-in zoom-in-95 backdrop-blur-none",
                    "mt-2",
                    align === "start" && "left-0",
                    align === "end" && "right-0",
                    align === "center" && "left-1/2 -translate-x-1/2",
                    className
                )}
                style={{ ...style, backgroundColor: "white" }}
                {...props}
            >
                {props.children}
            </div>
        )
    }
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
