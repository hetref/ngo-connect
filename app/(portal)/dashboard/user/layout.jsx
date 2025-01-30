"use client";

import React, { useState } from "react";
import { SideNav } from "@/components/SideNav";
import { 
  LayoutDashboard, 
  Search, 
  Calendar, 
  Trophy, 
  Settings, 
  LogOut, 
  User,
  UsersRound,
  IndianRupee,
  ReceiptIndianRupee
} from "lucide-react";
import Chatbot from "@/components/chatbot";

const NavConfig = {
  mainNavItems: [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard/user" },
    { name: "Search Activities", icon: Search, href: "/dashboard/user/activities/search-activity" },
    { name: "Activity Participation", icon: Calendar, href: "/dashboard/user/activities" },
    { name: "Volunteered", icon: UsersRound, href: "/dashboard/user/volunteer" },
    { name: "Donations", icon: IndianRupee, href: "/dashboard/user/donations" },
    { name: "Donate", icon: ReceiptIndianRupee, href: "/dashboard/user/donations/donate" },
  ],
  bottomNavItems: [
    { name: "Profile", icon: User, href: "/dashboard/user/profile" },
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
        navConfig={NavConfig}
        type="volunteer"
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