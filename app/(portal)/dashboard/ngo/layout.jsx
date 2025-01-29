"use client";

import React, { useState } from "react";
import { SideNav } from "@/components/SideNav";
import { 
  LayoutDashboard, 
  FilePenLine, 
  CalendarDays, 
  Users, 
  IndianRupee, 
  Store, 
  Settings, 
  LogOut 
} from "lucide-react";
import Chatbot from "@/components/chatbot";

const ngoNavConfig = {
  mainNavItems: [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard/ngo" },
    { name: "Reports", icon: FilePenLine, href: "/dashboard/ngo/reports" },
  ],
  managementNavItems: [
    { name: "Activity Management", icon: CalendarDays, href: "/dashboard/ngo/activities" },
    { name: "Member Management", icon: Users, href: "/dashboard/ngo/members" },
  ],
  financeNavItems: [
    { name: "Donation Management", icon: IndianRupee, href: "/dashboard/ngo/donations" },
    { name: "Store Management", icon: Store, href: "/dashboard/ngo/store" },
  ],
  bottomNavItems: [
    { name: "Settings", icon: Settings, href: "/dashboard/ngo/settings" },
    { name: "Logout", icon: LogOut, href: "/logout" },
  ]
};

const Layout = ({ children }) => {
  const [isSideNavOpen, setIsSideNavOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideNav 
        isOpen={isSideNavOpen} 
        setIsOpen={setIsSideNavOpen} 
        navConfig={ngoNavConfig}
        type="ngo"
      />
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
