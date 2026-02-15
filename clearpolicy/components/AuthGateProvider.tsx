"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";

type AuthGate = { isSignedIn: boolean; openSignUp: () => void };

const AuthGateContext = createContext<AuthGate>({
  isSignedIn: true, // default: no gating when Clerk is not configured
  openSignUp: () => {},
});

export const useAuthGate = () => useContext(AuthGateContext);

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const clerk = useClerk();

  return (
    <AuthGateContext.Provider
      value={{
        isSignedIn: !!isSignedIn,
        openSignUp: () => clerk.openSignUp({}),
      }}
    >
      {children}
    </AuthGateContext.Provider>
  );
}
