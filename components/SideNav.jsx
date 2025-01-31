"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FilePenLine,
  CalendarDays,
  Users,
  IndianRupee,
  BadgeIndianRupee,
  Store,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export function SideNav({ isOpen, setIsOpen, navConfig, type }) {
  const [selectedItem, setSelectedItem] = useState("Dashboard");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSideNav = () => setIsOpen(!isOpen);

  const router = useRouter();

  const signOutHandler = () => {
    signOut(auth).then(() => {
      router.push("/login");
    });
  };

  const renderNavItems = (items) => (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.name}>
          <Link
            href={item.href}
            className={cn(
              "flex items-center rounded-lg p-2 text-gray-700 transition-colors duration-200",
              selectedItem === item.name
                ? "bg-[#1CAC78] text-white"
                : "hover:bg-[#1CAC78] hover:bg-opacity-10 hover:text-[#1CAC78]",
              !isOpen && "justify-center"
            )}
            onClick={() => {
              setSelectedItem(item.name);
              if (isMobile) setIsOpen(false);
            }}
          >
            <item.icon className="h-6 w-6" />
            {isOpen && <span className="ml-3">{item.name}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <motion.nav
      className={cn(
        "fixed left-0 top-0 z-50 h-full bg-white shadow-lg transition-all duration-300",
        isOpen ? "w-64" : isMobile ? "w-0" : "w-16"
      )}
      initial={false}
      animate={{ width: isOpen ? 256 : isMobile ? 0 : 64 }}
    >
      <div className="flex h-full flex-col p-4">
        <div
          className={cn(
            "mb-8 flex items-center",
            isOpen ? "justify-between" : "justify-center"
          )}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 h-8">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-full w-full object-contain"
              />
            </div>
            {isOpen && (
              <span className="ml-2 text-xl font-bold">NGO-Connect</span>
            )}
          </div>
          {/* {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSideNav}
              className="hidden md:flex"
            >
              {isOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )} */}
          {isMobile && isOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSideNav}
              className="md:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {renderNavItems(navConfig.mainNavItems)}
          {type === "ngo" && isOpen && (
            <div className="my-4 border-t border-gray-200" />
          )}
          {type === "ngo" && renderNavItems(navConfig.managementNavItems)}
          {type === "ngo" && isOpen && (
            <div className="my-4 border-t border-gray-200" />
          )}
          {type === "ngo" && renderNavItems(navConfig.financeNavItems)}
        </div>
        <div className="mt-auto">
          {isOpen && <div className="my-4 border-t border-gray-200" />}
          {renderNavItems(navConfig.bottomNavItems)}

          {/* <li> */}
          <button
            className={cn(
              "flex items-center rounded-lg p-2 text-gray-700 transition-colors duration-200 w-full",
              selectedItem === "Logout"
                ? "bg-[#1CAC78] text-white"
                : "hover:bg-[#1CAC78] hover:bg-opacity-10 hover:text-[#1CAC78]",
              !isOpen && "justify-center"
            )}
            variant="none"
            onClick={signOutHandler}
          >
            <LogOut className="h-6 w-6" />
            {isOpen && <span className="ml-3">Logout</span>}
          </button>
          <button
            className={cn(
              "flex items-center rounded-lg p-2 text-gray-700 transition-colors duration-200 w-full hover:bg-[#1CAC78] hover:bg-opacity-10 hover:text-[#1CAC78]",
              !isOpen && "justify-center"
            )}
            variant="none"
            onClick={toggleSideNav}
          >
            {isOpen ? (
              <>
                <ChevronLeft className="h-6 w-6" />
                <span className="ml-3">Collapse</span>
              </>
            ) : (
              <>
                <ChevronRight className="h-6 w-6" />
              </>
            )}
          </button>
          {/* </li> */}
        </div>
      </div>
    </motion.nav>
  );
}
