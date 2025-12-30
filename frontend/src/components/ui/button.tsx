import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"
// Note: We need to install @radix-ui/react-slot. I'll stick to simple button for now to avoid dependency hell if not critical.
// Actually shadcn uses it. I will simplify for now to standard button if Slot is not available.
// I installed framer-motion but not radix.
// I'll make a simpler button for now.

const buttonVariants = ({ variant = "default", size = "default", className = "" }: { variant?: "default" | "ghost" | "outline" | "destructive" | "link", size?: "default" | "sm" | "lg" | "icon", className?: string } = {}) => {
    const variants = {
        default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
        link: "text-primary underline-offset-4 hover:underline"
    }
    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
    }
    return cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant as keyof typeof variants] || variants.default,
        sizes[size as keyof typeof sizes] || sizes.default,
        className
    )
}

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "ghost" | "outline" | "destructive" | "link", size?: "default" | "sm" | "lg" | "icon" }>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                ref={ref}
                suppressHydrationWarning
                className={buttonVariants({ variant, size, className })}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
