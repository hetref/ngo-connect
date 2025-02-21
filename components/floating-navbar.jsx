"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import logoRect from "@/assets/logo/rectangle-logo.png";

export default function FloatingNavbar({ className }) {
  const { setTheme, theme } = useTheme();

  return (
    <>
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-blue-500"
        >
          <Image
            src={logoRect}
            alt="NGO-Connect"
            width={600}
            height={600}
            className="h-[80px] w-fit"
          />
        </Link>
      </div>

      <nav
        className={cn(
          "fixed top-4 left-1/2 transform -translate-x-1/2 z-50",
          "bg-background/80 backdrop-blur-sm rounded-full",
          "border border-border shadow-lg",
          "p-2",
          className
        )}
      >
        <NavigationMenu>
          <NavigationMenuList className="space-x-2">
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                href="/"
                style={{
                  backgroundColor: "transparent",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                href="/about"
                style={{
                  backgroundColor: "transparent",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                About
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                href="/pricing"
                style={{
                  backgroundColor: "transparent",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                Pricing
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                href="/contact"
                style={{
                  backgroundColor: "transparent",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                Contact Us
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                href="/ngo"
                style={{
                  backgroundColor: "transparent",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                NGO
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <SunIcon className="h-[1.2rem] w-[1.2rem]" />
                ) : (
                  <MoonIcon className="h-[1.2rem] w-[1.2rem]" />
                )}
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>

      <div className="fixed top-4 right-4 z-50 flex gap-4">
        <Link
          href="/register"
          className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-full font-medium hover:opacity-90 transition-opacity"
        >
          Sign Up
        </Link>
        <Link
          href="/login"
          className={cn(
            "px-6 py-2 rounded-full font-medium transition-colors",
            "border-2 border-foreground/20",
            "text-foreground",
            "hover:bg-foreground/10"
          )}
        >
          Sign In
        </Link>
      </div>
    </>
  );
}

const ListItem = React.forwardRef(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = "ListItem";
