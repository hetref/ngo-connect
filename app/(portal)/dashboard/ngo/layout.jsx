"use client";

import React, { useState } from "react";
import { SideNav } from "@/components/SideNav";
import { 
  LayoutDashboard, 
  User, 
  CalendarDays, 
  Users, 
  IndianRupee, 
  BadgeIndianRupee, 
  Store, 
  Settings, 
  LogOut 
} from "lucide-react";
import Chatbot from "@/components/chatbot";




const Layout = ({ children }) => {
  const [isSideNavOpen, setIsSideNavOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideNav isOpen={isSideNavOpen} setIsOpen={setIsSideNavOpen} />
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingLeft: isSideNavOpen ? "256px" : "64px",
          transition: "padding-left 0.3s",
        }}
      >
        <div className="p-4 md:p-8">
          {children}
        </div>
        <Chatbot />
      </main>
    </div>
  );
};

export default Layout;
