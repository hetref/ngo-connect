"use client";

import React, { useState, useEffect } from "react";
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
  ReceiptIndianRupee,
  Users,
} from "lucide-react";
import Chatbot from "@/components/chatbot";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Loading from "@/components/loading/Loading";

const NavConfig = {
  mainNavItems: [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard/user" },
    {
      name: "Search Activities",
      icon: Search,
      href: "/dashboard/user/activities/search-activity",
    },
    {
      name: "Campaigns",
      icon: Settings,
      href: "/dashboard/user/campaigns/search-campaign",
    },
    {
      name: "Activity Participation",
      icon: Calendar,
      href: "/dashboard/user/activities",
    },
    {
      name: "Volunteered",
      icon: UsersRound,
      href: "/dashboard/user/volunteer",
    },
    { name: "Donations", icon: IndianRupee, href: "/dashboard/user/donations" },
  ],
  bottomNavItems: [
    { name: "Profile", icon: User, href: "/dashboard/user/profile" },
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
        console.log("User data:", userData);
        if (userData.type === "ngo") {
          setLoading(false);
          router.push("/dashboard/ngo");
        }
      }
      setLoading(false);
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
        <div className="p-4 md:p-8">{children}</div>
        <Chatbot />
      </main>
    </div>
  );
};

export default Layout;
