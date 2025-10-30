import type React from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { AdminRightSidebar } from "@/components/admin/right-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AIProductDraftProvider } from "@/contexts/ai-product-draft-context";
import { AIFormFieldsProvider } from "@/contexts/ai-form-fields-context";
import { RightSidebarProvider } from "@/contexts/right-sidebar-context";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AIProductDraftProvider>
      <AIFormFieldsProvider>
        <RightSidebarProvider>
          <SidebarProvider>
            <AdminSidebar />
            <SidebarInset className="flex h-screen flex-col overflow-hidden">
              <AdminHeader />
              <main className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-auto p-4 md:p-6">
                  {children}
                </div>
                <AdminRightSidebar />
              </main>
            </SidebarInset>
          </SidebarProvider>
        </RightSidebarProvider>
      </AIFormFieldsProvider>
    </AIProductDraftProvider>
  );
}
