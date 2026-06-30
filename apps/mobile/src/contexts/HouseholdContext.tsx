import React, { createContext, useContext } from 'react';

export interface HouseholdInfo {
  householdId: string;
  householdName: string;
}

interface HouseholdContextValue extends HouseholdInfo {
  setHousehold: (info: HouseholdInfo) => void;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({
  value,
  children,
}: {
  value: HouseholdContextValue;
  children: React.ReactNode;
}) {
  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold(): HouseholdContextValue {
  const ctx = useContext(HouseholdContext);
  if (!ctx) {
    throw new Error('useHousehold must be used within HouseholdProvider');
  }
  return ctx;
}
