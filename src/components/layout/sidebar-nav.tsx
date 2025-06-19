"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

interface SidebarNavProps {
  items: NavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  if (!items?.length) {
    return null;
  }

  return (
    <SidebarMenu>
      {items.map((item, index) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        
        return (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.title}
              className={cn(
                "nav-item group relative justify-start transition-all duration-200",
                isActive && "active bg-primary/10 text-primary font-medium",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
              data-title={item.title}
            >
              <Link href={item.disabled ? '#' : item.href}>
                <item.icon className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  "mr-3 group-data-[state=expanded]:mr-3 group-data-[state=collapsed]:mx-auto",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="transition-colors duration-200">{item.title}</span>
                {item.label && (
                  <Badge 
                    variant={isActive ? "default" : "outline"} 
                    className="ml-auto text-xs"
                  >
                    {item.label}
                  </Badge>
                )}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
