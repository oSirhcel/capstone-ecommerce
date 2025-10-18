"use client";

import { createContext, useContext, type ReactNode } from "react";

interface CustomerDetailContextValue {
  customerId: string;
}

const CustomerDetailContext = createContext<
  CustomerDetailContextValue | undefined
>(undefined);

interface CustomerDetailProviderProps {
  customerId: string;
  children: ReactNode;
}

export function CustomerDetailProvider({
  customerId,
  children,
}: CustomerDetailProviderProps) {
  return (
    <CustomerDetailContext.Provider value={{ customerId }}>
      {children}
    </CustomerDetailContext.Provider>
  );
}

export function useCustomerDetail() {
  const context = useContext(CustomerDetailContext);
  if (context === undefined) {
    throw new Error(
      "useCustomerDetail must be used within a CustomerDetailProvider",
    );
  }
  return context;
}
