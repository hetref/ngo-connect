import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider"
import FloatingNavbar from "@/components/floating-navbar";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/footer";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "NGO-Connect",
  description: "NGO-Connect is a platform for NGOs to manage their activities and events.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <main className="flex-1">
                {children}
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
