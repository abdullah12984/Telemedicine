import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Simple Dialog using native HTML dialog or portal
const DialogContext = React.createContext(null)

const Dialog = ({ children, open = false, onOpenChange, ...props }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = ({ children, asChild, ...props }) => {
  const { onOpenChange } = React.useContext(DialogContext)
  const child = asChild ? children : <button>{children}</button>
  return React.cloneElement(child, {
    onClick: (e) => {
      onOpenChange(true)
      if (child.props?.onClick) child.props.onClick(e)
    },
    ...props,
  })
}

const DialogPortal = ({ children }) => {
  const { open } = React.useContext(DialogContext)
  if (!open) return null
  return children
}

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => {
  const { open } = React.useContext(DialogContext)
  if (!open) return null
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
})
DialogOverlay.displayName = "DialogOverlay"

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(DialogContext)
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <DialogOverlay onClick={() => onOpenChange(false)} />
      <div
        ref={ref}
        className={cn(
          "relative z-50 grid w-full max-w-lg gap-4 border bg-white p-6 shadow-lg sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  )
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
DialogDescription.displayName = "DialogDescription"

const DialogClose = ({ children, asChild, ...props }) => {
  const { onOpenChange } = React.useContext(DialogContext)
  const child = asChild ? children : <button>{children || "Close"}</button>
  return React.cloneElement(child, {
    onClick: (e) => {
      onOpenChange(false)
      if (child.props?.onClick) child.props.onClick(e)
    },
    ...props,
  })
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}