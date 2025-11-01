import { usePathname } from "next/navigation";

/**
 * Hook to detect current page context
 * Computed directly from pathname - no state or effects needed
 */
export function usePageContext() {
  const pathname = usePathname();

  return {
    pathname: pathname || "",
    isOnAddProductPage: pathname === "/admin/products/add",
  };
}
