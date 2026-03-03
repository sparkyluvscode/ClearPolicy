"use client";

import { createContext, useContext, useCallback, ReactNode } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

type AuthGate = {
  isSignedIn: boolean;
  firstName: string | null;
  openSignUp: () => void;
};

function navigateToSignUp() {
  const current = window.location.pathname + window.location.search;
  const url = `/sign-up?redirect_url=${encodeURIComponent(current)}`;
  window.location.href = url;
}

const AuthGateContext = createContext<AuthGate>({
  isSignedIn: true,
  firstName: null,
  openSignUp: navigateToSignUp,
});

export const useAuthGate = () => useContext(AuthGateContext);

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  const openSignUp = useCallback(() => {
    navigateToSignUp();
  }, []);

  return (
    <AuthGateContext.Provider
      value={{
        // While Clerk is loading, treat user as signed-in to avoid
        // falsely gating someone who IS signed in.
        isSignedIn: isLoaded ? !!isSignedIn : true,
        firstName: user?.firstName ?? null,
        openSignUp,
      }}
    >
      {children}
    </AuthGateContext.Provider>
  );
}
