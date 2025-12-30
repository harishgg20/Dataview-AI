import * as React from "react"
import * as ReactDOM from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const DialogContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
} | undefined>(undefined)

const Dialog = ({ children, open, onOpenChange }: any) => {
    const [isOpen, setIsOpen] = React.useState(open || false)

    React.useEffect(() => {
        if (open !== undefined) setIsOpen(open)
    }, [open])

    const handleOpenChange = (newOpen: boolean) => {
        setIsOpen(newOpen)
        if (onOpenChange) onOpenChange(newOpen)
    }

    return (
        <DialogContext.Provider value={{ open: isOpen, setOpen: handleOpenChange }}>
            {children}
        </DialogContext.Provider>
    )
}

const DialogTrigger = ({ children, asChild }: any) => {
    const { setOpen } = React.useContext(DialogContext)!
    return (
        <div onClick={() => setOpen(true)} className="inline-block cursor-pointer">
            {children}
        </div>
    )
}

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        const { open, setOpen } = React.useContext(DialogContext)!
        const [mounted, setMounted] = React.useState(false)

        React.useEffect(() => {
            setMounted(true)
        }, [])

        if (!open || !mounted) return null

        if (typeof document === "undefined") return null

        return ReactDOM.createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0" data-state={open ? "open" : "closed"}>
                <div
                    ref={ref}
                    className={cn(
                        "relative grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg md:w-full bg-white",
                        className
                    )}
                    {...props}
                >
                    {children}
                    <button
                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                        onClick={() => setOpen(false)}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>
            </div>,
            document.body
        )
    }
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
    )
)
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
    )
)
DialogDescription.displayName = "DialogDescription"

export {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
}
