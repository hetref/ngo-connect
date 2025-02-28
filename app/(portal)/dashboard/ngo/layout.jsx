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
  Scan,
} from "lucide-react";
import Chatbot from "@/components/chatbot";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import Loading from "@/components/loading/Loading";

const Layout = ({ children }) => {
  const [isSideNavOpen, setIsSideNavOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const router = useRouter();

  useEffect(() => {
    let userDocUnsubscribe = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(true);
        router.push("/login");
        return;
      }

      // Set up real-time listener for the user document
      const userDocRef = doc(db, "users", user.uid);

      // Clean up any existing listener before creating a new one
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }

      userDocUnsubscribe = onSnapshot(
        userDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const currentUserData = docSnapshot.data();
            if (currentUserData.type === "ngo") {
              setLoading(false);
              setUserData(currentUserData);
            } else if (currentUserData.type === "user") {
              setLoading(true);
              router.push("/dashboard/user");
            }
          } else {
            setLoading(true);
            router.push("/login");
          }
        },
        (error) => {
          console.error("Error listening to user document:", error);
          setLoading(false);
        }
      );
    });

    // Clean up both listeners when component unmounts
    return () => {
      authUnsubscribe();
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }
    };
  }, [router]);

  // Base navigation configuration
  const baseNavConfig = {
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
      {
        name: "Coordinated Activities",
        icon: Scan,
        href: "/dashboard/ngo/coordinated-activities",
      },
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

  // Get the appropriate navigation config based on user role and access level
  const getNavConfig = () => {
    // For admin users - full access
    if (userData.role === "admin") {
      return baseNavConfig;
    }

    // For member users with different access levels
    if (userData.role === "member") {
      // Access level 1 - Limited access
      if (userData.accessLevel === "level1") {
        return {
          mainNavItems: [
            {
              name: "Dashboard",
              icon: LayoutDashboard,
              href: "/dashboard/ngo",
            },
          ],
          managementNavItems: [
            {
              name: "Activities",
              icon: CalendarDays,
              href: "/dashboard/ngo/activities",
            },
            {
              name: "Coordinated Activities",
              icon: Scan,
              href: "/dashboard/ngo/coordinated-activities",
            },
          ],
          financeNavItems: [
            {
              name: "Inventory",
              icon: Store,
              href: "/dashboard/ngo/inventory",
            },
          ],
          bottomNavItems: [
            {
              name: "Settings",
              icon: Settings,
              href: "/dashboard/ngo/settings",
            },
          ],
        };
      }
      // Access level 2 - Full access (same as admin)
      else if (userData.accessLevel === "level2") {
        return baseNavConfig;
      }
    }

    // Default fallback - basic access
    return {
      mainNavItems: [
        { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard/ngo" },
      ],
      managementNavItems: [],
      financeNavItems: [],
      bottomNavItems: [
        { name: "Settings", icon: Settings, href: "/dashboard/ngo/settings" },
      ],
    };
  };

  if (loading) {
    return <Loading />;
  }

  const navConfig = getNavConfig();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideNav
        isOpen={isSideNavOpen}
        setIsOpen={setIsSideNavOpen}
        navConfig={navConfig}
        type={userData.type}
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
