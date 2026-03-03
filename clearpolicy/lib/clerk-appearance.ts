import type { Appearance } from "@clerk/types";

/**
 * Shared Clerk appearance config that carries ClearPolicy's design
 * system (Inter + Libre Baskerville, warm cream, civic blue) into
 * every Clerk-rendered component. Includes dark: variants for dark mode.
 */
export const clerkAppearance: Appearance = {
  variables: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    fontFamilyButtons: '"Inter", system-ui, sans-serif',
    colorPrimary: "#4A7BBA",
    colorDanger: "#D76A5F",
    colorSuccess: "#5EAF8E",
    colorBackground: "#FAF9F6",
    colorText: "#1A1A1A",
    colorTextSecondary: "#5A5A5A",
    colorInputBackground: "#FDFCF7",
    colorInputText: "#1A1A1A",
    borderRadius: "0.75rem",
    fontSize: "md",
  },
  elements: {
    card: "rounded-2xl border border-[rgba(26,26,26,0.08)] dark:border-[rgba(248,248,240,0.1)] shadow-lg bg-[#FAF9F6] dark:bg-[#1E1E1C]",
    headerTitle:
      'font-bold tracking-tight [font-family:"Libre_Baskerville",Georgia,serif] dark:text-[#FDFCF7]',
    headerSubtitle: "text-[#5A5A5A] dark:text-[#B8B6AD]",
    formButtonPrimary:
      "bg-[#4A7BBA] dark:bg-[#7BA3D4] hover:brightness-110 active:scale-[0.98] rounded-xl text-sm font-semibold shadow-none transition-all",
    formFieldInput:
      "font-user-input rounded-xl border border-[rgba(26,26,26,0.08)] dark:border-[rgba(248,248,240,0.1)] bg-[#FDFCF7] dark:bg-[rgba(42,42,39,0.7)] text-[#1A1A1A] dark:text-[#FDFCF7] placeholder:text-[#8A8A8A] dark:placeholder:text-[#7A7870] focus:ring-2 focus:ring-[#4A7BBA]/15 dark:focus:ring-[#7BA3D4]/20 focus:border-[#4A7BBA]/30 dark:focus:border-[#7BA3D4]/30 transition-all",
    formFieldLabel: "text-[#1A1A1A] dark:text-[#FDFCF7] font-medium text-sm",
    footerAction: "text-sm",
    footerActionLink:
      "text-[#4A7BBA] dark:text-[#7BA3D4] hover:underline font-medium transition-colors",
    socialButtonsBlockButton:
      "rounded-xl border border-[rgba(26,26,26,0.08)] dark:border-[rgba(248,248,240,0.1)] bg-[#FDFCF7] dark:bg-[rgba(42,42,39,0.7)] hover:bg-[rgba(248,247,244,0.95)] dark:hover:bg-[rgba(48,47,43,0.8)] text-[#1A1A1A] dark:text-[#FDFCF7] font-medium transition-all",
    socialButtonsBlockButtonText: "font-medium",
    dividerLine: "bg-[rgba(26,26,26,0.08)] dark:bg-[rgba(248,248,240,0.1)]",
    dividerText: "text-[#8A8A8A] dark:text-[#7A7870] text-xs uppercase tracking-wider",
    identityPreviewEditButton: "text-[#4A7BBA] dark:text-[#7BA3D4]",
    identityPreviewText: "dark:text-[#FDFCF7]",
    formResendCodeLink: "text-[#4A7BBA] dark:text-[#7BA3D4]",
    otpCodeFieldInput:
      "font-user-input rounded-lg border border-[rgba(26,26,26,0.08)] dark:border-[rgba(248,248,240,0.1)] bg-[#FDFCF7] dark:bg-[rgba(42,42,39,0.7)] text-[#1A1A1A] dark:text-[#FDFCF7] focus:ring-2 focus:ring-[#4A7BBA]/15 dark:focus:ring-[#7BA3D4]/20",
    alert: "rounded-xl",
    alertText: "text-sm",
    avatarBox: "rounded-full",
    badge: "rounded-full text-xs font-medium",
    userButtonPopoverCard:
      "rounded-2xl border border-[rgba(26,26,26,0.08)] dark:border-[rgba(248,248,240,0.1)] shadow-lg bg-[#FAF9F6] dark:bg-[#1E1E1C]",
    userButtonPopoverActionButton:
      "rounded-lg hover:bg-[rgba(248,247,244,0.95)] dark:hover:bg-[rgba(48,47,43,0.8)] dark:text-[#FDFCF7]",
    userButtonPopoverActionButtonText: "dark:text-[#FDFCF7]",
    userButtonPopoverFooter:
      "border-t border-[rgba(26,26,26,0.08)] dark:border-[rgba(248,248,240,0.1)]",
  },
};
