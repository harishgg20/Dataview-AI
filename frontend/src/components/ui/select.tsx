"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

type SelectContextType = {
    value?: string
    onValueChange?: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
    placeholder?: string
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined)

const Select = ({ children, value, onValueChange, defaultValue }: any) => {
    const [open, setOpen] = React.useState(false)
    const [val, setVal] = React.useState(value || defaultValue || "")

    React.useEffect(() => {
        if (value !== undefined) setVal(value)
    }, [value])

    const handleValueChange = (newValue: string) => {
        setVal(newValue)
        if (onValueChange) onValueChange(newValue)
        setOpen(false)
    }

    // Close when clicking outside
    const ref = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <SelectContext.Provider value={{ value: val, onValueChange: handleValueChange, open, setOpen }}>
            <div ref={ref} className="relative inline-block w-full text-left">
                {children}
            </div>
        </SelectContext.Provider>
    )
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, children, ...props }, ref) => {
        const { open, setOpen } = React.useContext(SelectContext)!
        return (
            <button
                ref={ref}
                type="button"
                suppressHydrationWarning={true}
                onClick={() => setOpen(!open)}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
        )
    }
)
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }>(
    ({ className, placeholder, children, ...props }, ref) => {
        const { value } = React.useContext(SelectContext)!
        return (
            <span ref={ref} className={cn("block truncate", className)} {...props}>
                {children ? children : (value ? value : placeholder)}
            </span>
        )
    }
)
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { position?: "popper" | "item" }>(
    ({ className, children, position = "popper", ...props }, ref) => {
        const { open } = React.useContext(SelectContext)!

        if (!open) return null

        return (
            <div
                ref={ref}
                className={cn(
                    "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 top-full mt-1 w-full",
                    className
                )}
                {...props}
            >
                <div className="w-full p-1 h-full max-h-[200px] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        )
    }
)
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
    ({ className, children, value, ...props }, ref) => {
        const { value: selectedValue, onValueChange } = React.useContext(SelectContext)!
        return (
            <div
                ref={ref}
                onClick={(e) => {
                    e.stopPropagation()
                    onValueChange && onValueChange(value)
                }}
                className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                    value === selectedValue && "bg-accent/50",
                    className
                )}
                {...props}
            >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {value === selectedValue && <Check className="h-4 w-4" />}
                </span>
                <span className="truncate text-foreground">{children}</span>
            </div>
        )
    }
)
SelectItem.displayName = "SelectItem"

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator }

// Mocks for unused exports to prevent import errors
const SelectGroup = ({ children }: any) => <>{children}</>
const SelectLabel = ({ children }: any) => <div className="px-2 py-1.5 text-sm font-semibold">{children}</div>
const SelectSeparator = () => <div className="-mx-1 my-1 h-px bg-muted" />
