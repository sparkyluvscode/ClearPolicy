"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";

type AuthGate = {
  isSignedIn: boolean;
  firstName: string | null;
  openSignUp: () => void;
};

const AuthGateContext = createContext<AuthGate>({
  isSignedIn: true, // default: no gating when Clerk is not configured
  firstName: null,
  openSignUp: () => {},
});

export const useAuthGate = () => useContext(AuthGateContext);

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();

  return (
    <AuthGateContext.Provider
      value={{
        isSignedIn: !!isSignedIn,
        firstName: user?.firstName ?? null,
        openSignUp: () => clerk.openSignUp({}),
      }}
    >
      {children}
    </AuthGateContext.Provider>
  );
}
