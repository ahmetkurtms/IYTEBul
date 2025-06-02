"use client"

import * as React from "react"
import { Home, MessageSquare, User, X } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"

const SidebarContext = React.createContext<{
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}>({
  open: false,
  setOpen: () => {},
})

interface SidebarProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
}

export function SidebarProvider({ children, defaultOpen = false }: SidebarProviderProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const { open, setOpen } = useSidebar()
  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[260px] max-w-full bg-white shadow-2xl rounded-r-2xl flex flex-col transition-transform duration-300 border-r border-gray-200",
          open ? "translate-x-0" : "-translate-x-full",
          className
        )}
        {...props}
      >
        {/* Header: Logo & Close */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 bg-gradient-to-r from-[#9a0e20] to-[#7a0b19] rounded-tr-2xl">
          <div className="flex items-center gap-2 select-none">
            <Image src="/assets/iyte_logo_tr.png" alt="IYTEBul" width={36} height={36} className="rounded bg-white/80 p-1" />
            <span className="text-lg font-bold text-white tracking-wide">IYTEBul</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* Navigation */}
        <nav className="flex-1 py-6 px-2 flex flex-col gap-1">
          <SidebarNavItem
            icon={Home}
            label="Home"
            href="/home"
          />
          <SidebarNavItem
            icon={MessageSquare}
            label="Messages"
            href="/messages"
          />
          <SidebarNavItem
            icon={User}
            label="Profile"
            href="/profile"
          />
        </nav>
        {/* Optional Footer */}
        {/* <div className="p-4 border-t border-gray-100">Footer</div> */}
      </aside>
    </>
  )
}

interface SidebarNavItemProps {
  icon: React.ElementType
  label: string
  href: string
}

function SidebarNavItem({ icon: Icon, label, href }: SidebarNavItemProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { setOpen } = useSidebar()
  const isActive = pathname === href
  return (
    <button
      onClick={() => {
        router.push(href)
        setOpen(false)
      }}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2 rounded-lg font-medium text-base transition-colors cursor-pointer",
        isActive
          ? "bg-[#f8d7da] text-[#9a0e20] shadow-sm"
          : "text-gray-700 hover:bg-[#f8d7da]/60 hover:text-[#9a0e20]"
      )}
    >
      <Icon className={cn("w-5 h-5", isActive ? "text-[#9a0e20]" : "text-gray-500")}/>
      <span>{label}</span>
    </button>
  )
}
