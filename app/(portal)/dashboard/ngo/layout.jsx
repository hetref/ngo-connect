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

const mainNavItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard/ngo" },
  { name: "Profile Management", icon: User, href: "/dashboard/ngo/profile" },
];

const managementNavItems = [
  { name: "Event Management", icon: CalendarDays, href: "/dashboard/ngo/events" },
  { name: "Volunteer Management", icon: Users, href: "/dashboard/ngo/volunteers" },
];

const financeNavItems = [
  { name: "Donation Management", icon: IndianRupee, href: "/dashboard/ngo/donations" },
  { name: "Sponsorships", icon: BadgeIndianRupee, href: "/dashboard/ngo/sponsorships" },
  { name: "Store Management", icon: Store, href: "/dashboard/ngo/store" },
];

const bottomNavItems = [
  { name: "Settings", icon: Settings, href: "/dashboard/ngo/settings" },
  { name: "Logout", icon: LogOut, href: "/logout" },
];

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
      </main>
    </div>
  );
};

export default Layout;
