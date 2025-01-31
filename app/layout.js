import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider"
import FloatingNavbar from "@/components/floating-navbar";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/footer";

// const ubuntu = Nunito({
//   variable: "--font-ubuntu",
//   subsets: ["latin"],
//   weight: ["400", "500", "700"],
// });


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
        <div className="relative flex min-h-screen flex-col">
          <FloatingNavbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </ThemeProvider>
    </body>
  </html>
  );
}
