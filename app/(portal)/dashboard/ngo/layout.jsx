"use client";

import React, { useState, useEffect } from "react";
import { SideNav } from "@/components/SideNav";
import {
  LayoutDashboard,
  FilePenLine,
  CalendarDays,
  Users,
  IndianRupee,
  Store,
  Settings,
  LogOut,
  PackagePlus,
} from "lucide-react";
import Chatbot from "@/components/chatbot";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Loading from "@/components/loading/Loading";

const ngoNavConfig = {
  mainNavItems: [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard/ngo" },
    { name: "Reports", icon: FilePenLine, href: "/dashboard/ngo/reports" },
  ],
  managementNavItems: [
    {
      name: "Activities",
      icon: CalendarDays,
      href: "/dashboard/ngo/activities",
    },
    { name: "Members", icon: Users, href: "/dashboard/ngo/members" },
  ],
  financeNavItems: [
    {
      name: "Donations",
      icon: IndianRupee,
      href: "/dashboard/ngo/donations",
    },
  ],
  
  ProductNavItems: [
    { name: "Products", icon: PackagePlus, href: "/dashboard/ngo/products" },
    { name: "Inventory", icon: Store, href: "/dashboard/ngo/inventory" },
  ],
  
  bottomNavItems: [
    { name: "Settings", icon: Settings, href: "/dashboard/ngo/settings" },
  ],
};

const Layout = ({ children }) => {
  const [isSideNavOpen, setIsSideNavOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(true);
        router.push("/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.type === "ngo") {
          setLoading(false);
        } else if (userData.type === "user") {
          setLoading(true);
          router.push("/dashboard/user");
        }
      } else {
        setLoading(true);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <Loading />;
  }

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
        <div className="p-4 md:p-8">{children}</div>
        <Chatbot />
      </main>
    </div>
  );
};

export default Layout;
