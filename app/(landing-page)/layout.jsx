import FloatingNavbar from "@/components/floating-navbar";
import { Footer } from "@/components/footer";
import React from "react";

const Layout = ({ children }) => (
  <div>
    <FloatingNavbar />
    {children}
    <Footer />
  </div>
);

export default Layout;
