"use client";

import { createContext, useContext, useCallback, ReactNode } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";

type AuthGate = {
  isSignedIn: boolean;
  firstName: string | null;
  openSignUp: () => void;
};

const AuthGateContext = createContext<AuthGate>({
  isSignedIn: true,
  firstName: null,
  openSignUp: () => {
    window.location.href = "/sign-up";
  },
});

export const useAuthGate = () => useContext(AuthGateContext);

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();

  const openSignUp = useCallback(() => {
    try {
      if (clerk && typeof clerk.openSignUp === "function") {
        clerk.openSignUp({});
      } else {
        window.location.href = "/sign-up";
      }
    } catch {
      window.location.href = "/sign-up";
    }
  }, [clerk]);

  return (
    <AuthGateContext.Provider
      value={{
        isSignedIn: !!isSignedIn,
        firstName: user?.firstName ?? null,
        openSignUp,
      }}
    >
      {children}
    </AuthGateContext.Provider>
  );
}
