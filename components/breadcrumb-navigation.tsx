"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, ChevronRight } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

interface BreadcrumbNavigationProps {
  className?: string
}

// Define route mappings for better breadcrumb labels
const routeLabels: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Dashboard",
  "/team": "My Team",
  "/leaderboard": "Leaderboard", 
  "/results": "Results",
  "/marketplace": "Marketplace",
  "/treasury": "Treasury",
  "/premium": "Premium",
  "/profile": "Profile",
  "/rules": "Rules",
  "/sponsorship": "Sponsorship",
}

export function BreadcrumbNavigation({ className }: BreadcrumbNavigationProps) {
  const pathname = usePathname()
  
  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return null
  }

  // Split pathname into segments and filter out empty strings
  const pathSegments = pathname.split("/").filter(Boolean)
  
  // Build breadcrumb items
  const breadcrumbItems = []
  
  // Always start with Home
  breadcrumbItems.push({
    href: "/",
    label: "Home",
    isHome: true,
  })
  
  // Add dashboard if we're not on dashboard but on a feature page
  if (pathname !== "/dashboard" && pathSegments.length === 1) {
    breadcrumbItems.push({
      href: "/dashboard",
      label: "Dashboard",
      isHome: false,
    })
  }
  
  // Build path segments
  let currentPath = ""
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === pathSegments.length - 1
    
    breadcrumbItems.push({
      href: currentPath,
      label: routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1),
      isHome: false,
      isLast,
    })
  })

  return (
    <div className={cn("mb-4 sm:mb-6", className)}>
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <div key={item.href} className="flex items-center">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {item.isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1">
                    {item.isHome && <Home className="h-4 w-4" />}
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link 
                      href={item.href}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {item.isHome && <Home className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}