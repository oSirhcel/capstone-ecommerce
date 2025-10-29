import type React from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { WidgetProvider } from "@/contexts/ai-assistant-widget-context";
import { AIProductDraftProvider } from "@/contexts/ai-product-draft-context";
import { AIFormFieldsProvider } from "@/contexts/ai-form-fields-context";
import { AIAssistantWidget } from "@/components/ai-assistant/ai-assistant-widget";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WidgetProvider>
      <AIProductDraftProvider>
        <AIFormFieldsProvider>
          <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
              <AdminHeader />
              <main className="flex-1 overflow-auto p-4 md:p-6">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
          <AIAssistantWidget />
        </AIFormFieldsProvider>
      </AIProductDraftProvider>
    </WidgetProvider>
  );
}
