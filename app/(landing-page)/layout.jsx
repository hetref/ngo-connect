import FloatingNavbar from "@/components/floating-navbar";
import { Footer } from "@/components/footer";
import React from "react";
import { ThemeProvider } from "@/components/theme-provider";

const Layout = ({ children }) => (
  <div>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <FloatingNavbar />
      {children}
      <Footer />
    </ThemeProvider>
  </div>
);

export default Layout;
