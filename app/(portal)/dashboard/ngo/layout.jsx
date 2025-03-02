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
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import Loading from "@/components/loading/Loading";

const Layout = ({ children }) => {
  const [isSideNavOpen, setIsSideNavOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [ngoVerificationStatus, setNgoVerificationStatus] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let userDocUnsubscribe = null;
    let ngoDocUnsubscribe = null;

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
        async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const currentUserData = docSnapshot.data();
            if (currentUserData.type === "ngo") {
              setUserData(currentUserData);

              // Get NGO ID (either user's ID for admin or ngoId for members)
              const ngoId =
                currentUserData.role === "admin"
                  ? user.uid
                  : currentUserData.ngoId;

              if (ngoId) {
                // Set up listener for NGO document to check verification status
                const ngoDocRef = doc(db, "ngo", ngoId);

                if (ngoDocUnsubscribe) {
                  ngoDocUnsubscribe();
                }

                ngoDocUnsubscribe = onSnapshot(
                  ngoDocRef,
                  (ngoSnapshot) => {
                    if (ngoSnapshot.exists()) {
                      const ngoData = ngoSnapshot.data();
                      setNgoVerificationStatus(ngoData.isVerified);
                      setLoading(false);

                      // If NGO is not verified and user is not on settings page, redirect to settings
                      if (
                        ngoData.isVerified !== "verified" &&
                        pathname !== "/dashboard/ngo/settings"
                      ) {
                        router.push("/dashboard/ngo/settings");
                      }
                    } else {
                      setLoading(false);
                    }
                  },
                  (error) => {
                    console.error("Error listening to NGO document:", error);
                    setLoading(false);
                  }
                );
              } else {
                setLoading(false);
              }
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

    // Clean up all listeners when component unmounts
    return () => {
      authUnsubscribe();
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }
      if (ngoDocUnsubscribe) {
        ngoDocUnsubscribe();
      }
    };
  }, [router, pathname]);

  // Effect to handle path changes and redirect if needed
  useEffect(() => {
    // If verification status is loaded and not verified, and user is not on settings page
    if (
      !loading &&
      ngoVerificationStatus !== "verified" &&
      pathname !== "/dashboard/ngo/settings"
    ) {
      router.push("/dashboard/ngo/settings");
    }
  }, [pathname, ngoVerificationStatus, loading, router]);

  // Base navigation configuration
  const baseNavConfig = {
    mainNavItems: [
      { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard/ngo" },
      { name: "Reports", icon: FilePenLine, href: "/dashboard/ngo/reports" },
      { name: "Campaigns", icon: Store, href: "/dashboard/ngo/campaigns" },
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

  // Get the appropriate navigation config based on user role, access level, and verification status
  const getNavConfig = () => {
    // If NGO is not verified, only show settings
    if (ngoVerificationStatus !== "verified") {
      return {
        mainNavItems: [],
        managementNavItems: [],
        financeNavItems: [],
        ProductNavItems: [],
        bottomNavItems: [
          { name: "Settings", icon: Settings, href: "/dashboard/ngo/settings" },
        ],
      };
    }

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
        {ngoVerificationStatus !== "verified" &&
        pathname !== "/dashboard/ngo/settings" ? (
          <div className="p-4 md:p-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Your NGO is not verified yet. Please complete the
                    verification process in the settings page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 md:p-8">{children}</div>
        )}
        <Chatbot />
      </main>
    </div>
  );
};

export default Layout;
