"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  UsersIcon,
  PackageIcon,
  ShoppingCartIcon,
  StoreIcon,
  HomeIcon,
  CreditCardIcon,
  ShieldAlertIcon,
  PercentIcon,
  SettingsIcon,
  TruckIcon,
  WalletCardsIcon,
  ChevronRightIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useProfileQuery } from "@/hooks/admin/use-profile-query";
import { Skeleton } from "@/components/ui/skeleton";

const navigation = [
  { name: "Home", href: "/admin", icon: HomeIcon },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCartIcon },
  { name: "Products", href: "/admin/products", icon: PackageIcon },
  { name: "Customers", href: "/admin/customers", icon: UsersIcon },
  { name: "Payments", href: "/admin/payments", icon: CreditCardIcon },
  {
    name: "Risk Assessments",
    href: "/admin/risk-assessments",
    icon: ShieldAlertIcon,
  },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3Icon },
];

const settingsItems = [
  { name: "Store Management", href: "/admin/settings/store", icon: StoreIcon },
  { name: "Tax Settings", href: "/admin/settings/tax", icon: PercentIcon },
  {
    name: "Shipping Settings",
    href: "/admin/settings/shipping",
    icon: TruckIcon,
  },
  {
    name: "Payment Setup",
    href: "/admin/settings/payments",
    icon: WalletCardsIcon,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: profile, isLoading } = useProfileQuery();

  // Check if any settings route is active
  const isSettingsActive = settingsItems.some((item) =>
    pathname.startsWith(item.href),
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {isLoading ? (
              <div className="flex items-center gap-2 rounded-lg p-2">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <StoreIcon className="size-4" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ) : (
              <SidebarMenuButton size="lg" asChild>
                <Link href="/admin">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <StoreIcon className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {profile?.store?.name ?? "No Store"}
                    </span>
                    <span className="truncate text-xs">Admin Panel</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                // Check if current route or child route is active
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      className={cn(
                        isActive &&
                          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground border-primary-foreground/30",
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <Collapsible
                asChild
                defaultOpen={isSettingsActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Settings"
                      isActive={isSettingsActive}
                      className={cn(
                        isSettingsActive &&
                          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground border-primary-foreground/30",
                      )}
                    >
                      <SettingsIcon />
                      <span>Settings</span>
                      <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {settingsItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                          <SidebarMenuSubItem key={item.name}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <Link href={item.href}>
                                <item.icon />
                                <span>{item.name}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {isLoading ? (
              <div className="flex items-center gap-2 rounded-lg p-2">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-1 flex-col gap-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ) : (
              <SidebarMenuButton size="lg">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-full">
                  <span className="text-sm font-semibold">
                    {profile?.user?.username?.[0]?.toUpperCase() ?? "A"}
                  </span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {profile?.user?.username ?? "Admin User"}
                  </span>
                  <span className="truncate text-xs">
                    {profile?.user?.email ?? "admin@example.com"}
                  </span>
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
