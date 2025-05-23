"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { Menu } from "lucide-react"

import { cn } from "@/lib/utils"

const SidebarContext = React.createContext<{
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}>({
  open: true,
  setOpen: () => {},
})

interface SidebarProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
}

function SidebarProvider({ children, defaultOpen = true }: SidebarProviderProps) {
  const [open, setOpen] = React.useState(defaultOpen)

  return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>
}

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right"
}

function Sidebar({ className, side = "left", ...props }: SidebarProps) {
  const { open } = useSidebar()

  return (
    <div
      data-state={open ? "open" : "closed"}
      className={cn(
        "fixed inset-y-0 z-30 flex flex-col border-r bg-background transition-all duration-300 data-[state=closed]:w-[60px] data-[state=open]:w-[280px]",
        side === "right" ? "right-0 border-l border-r-0" : "left-0",
        className,
      )}
      {...props}
    />
  )
}

function SidebarTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useSidebar()

  return (
    <button
      onClick={() => setOpen(!open)}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
}

function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-auto", className)} {...props} />
}

function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex h-14 items-center border-b px-4", className)} {...props} />
}

function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex h-14 items-center border-t px-4", className)} {...props} />
}

function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1 p-2", className)} {...props} />
}

function SidebarGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useSidebar()

  if (!open) {
    return null
  }

  return <div className={cn("px-2 py-1 text-xs font-medium text-muted-foreground", className)} {...props} />
}

function SidebarGroupContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1", className)} {...props} />
}

function SidebarItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />
}

function SidebarItemButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open } = useSidebar()

  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        open ? "justify-start" : "justify-center",
        className,
      )}
      {...props}
    />
  )
}

function SidebarItemIcon({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("h-5 w-5 shrink-0", className)} {...props} />
}

function SidebarItemLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useSidebar()

  if (!open) {
    return null
  }

  return <div className={cn("flex-1", className)} {...props} />
}

const SidebarMenu = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("", className)} {...props} />,
)
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const { open } = useSidebar()

    return (
      <button
        ref={ref}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          open ? "justify-start" : "justify-center",
          className,
        )}
        {...props}
      />
    )
  },
)
SidebarMenuTrigger.displayName = "SidebarMenuTrigger"

const SidebarMenuContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { open } = useSidebar()

    if (!open) {
      return null
    }

    return <div ref={ref} className={cn("pl-4 pt-1 data-[state=closed]:hidden", className)} {...props} />
  },
)
SidebarMenuContent.displayName = "SidebarMenuContent"

const SidebarMenuItem = CollapsiblePrimitive.Root

const SidebarMenuButton = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const { open } = useSidebar()

  return (
    <CollapsiblePrimitive.Trigger
      ref={ref}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        open ? "justify-start" : "justify-center",
        className,
      )}
      {...props}
    >
      {children}
    </CollapsiblePrimitive.Trigger>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuSub = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, ...props }, ref) => {
  const { open } = useSidebar()

  if (!open) {
    return null
  }

  return <CollapsiblePrimitive.Content ref={ref} className={cn("pl-4 pt-1", className)} {...props} />
})
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("", className)} {...props} />,
)
\
SidebarMenuSubItem.displayName = "S  => (
  <div ref=
{
  ref
}
className={cn("", className)}
{
  ...props
}
;/>
))
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isActive?: boolean
  }
>(({ className, isActive, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      isActive && "bg-accent text-accent-foreground",
      className,
    )}
    {...props}
  />
))
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

function SidebarRail({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useSidebar()

  if (open) {
    return null
  }

  return <div className={cn("absolute inset-y-0 left-full h-full w-[1px] bg-border", className)} {...props} />
}

function SidebarInset({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useSidebar()

  return (
    <div
      className={cn("flex flex-col transition-all duration-300", open ? "ml-[280px]" : "ml-[60px]", className)}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarItem,
  SidebarItemButton,
  SidebarItemIcon,
  SidebarItemLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuContent,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuTrigger,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
}
