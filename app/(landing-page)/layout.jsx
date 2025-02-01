import FloatingNavbar from "@/components/floating-navbar";
import React from "react";

const Layout = ({ children }) => (
  <div>
    <FloatingNavbar />
    {children}
  </div>
);

export default Layout;
