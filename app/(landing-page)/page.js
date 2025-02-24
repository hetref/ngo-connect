"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FloatingNavbar from '@/components/floating-navbar'
import { BackgroundLines } from "@/components/ui/background-lines";
import { FeaturesSectionDemo } from "@/components/feature";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import LampDemo from "@/components/ui/lamp";


export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div>
        <div className="relative min-h-screen">
          <FloatingNavbar />
          <BackgroundLines>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-foreground">Welcome to</span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-blue-500">
                  NGO-Connect
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-8">
                Streamline your NGO management process with our powerful platform
              </p>
              <div className="flex gap-4">
                <Link
                  href="/register"
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  href="/ngo"
                  className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Explore NGOs
                </Link>
              </div>
            </div>
          </BackgroundLines>
        </div>

        <div className="relative bg-background dark:bg-black py-8 z-10">
          <div className="flex justify-center mb-16 relative">
            {/* Decorative lines */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-40 h-40">
              <div className="absolute top-0 left-1/2 w-[1px] h-20 bg-gradient-to-b from-purple-500/0 via-purple-500/70 to-purple-500/0"></div>
              <div className="absolute bottom-0 left-1/2 w-[1px] h-20 bg-gradient-to-t from-purple-500/0 via-purple-500/70 to-purple-500/0"></div>
              <div className="absolute left-0 top-1/2 h-[1px] w-20 bg-gradient-to-r from-purple-500/0 via-purple-500/70 to-purple-500/0"></div>
              <div className="absolute right-0 top-1/2 h-[1px] w-20 bg-gradient-to-l from-purple-500/0 via-purple-500/70 to-purple-500/0"></div>
            </div>

            {/* Button with spinning border */}
            <button className="relative inline-flex h-9 w-48 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-100" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                Features
              </span>
            </button>
          </div>
          <FeaturesSectionDemo />

          <div className="flex justify-center mb-16 relative">
            {/* Decorative lines */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-40 h-40">
              <div className="absolute top-0 left-1/2 w-[1px] h-20 bg-gradient-to-b from-purple-500/0 via-purple-500/70 to-purple-500/0"></div>
              <div className="absolute bottom-0 left-1/2 w-[1px] h-20 bg-gradient-to-t from-purple-500/0 via-purple-500/70 to-purple-500/0"></div>
              <div className="absolute left-0 top-1/2 h-[1px] w-20 bg-gradient-to-r from-purple-500/0 via-purple-500/70 to-purple-500/0"></div>
              <div className="absolute right-0 top-1/2 h-[1px] w-20 bg-gradient-to-l from-purple-500/0 via-purple-500/70 to-purple-500/0"></div>
            </div>

            {/* Button with spinning border */}
            <button className="relative inline-flex h-9 w-48 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-100" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                Why Choose Us?
              </span>
            </button>
          </div>

          <div className="max-w-3xl mx-auto px-4 py-16">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-semibold">Efficiency Meets Innovation</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  From AI-driven validation to QR-based attendance and e-certificates, our platform eliminates inefficiencies, making NGO management smarter and faster.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-semibold">Comprehensive Tools for Every User</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  Whether you're an admin, member, or student, our tailored tools ensure a seamless experience for organizing, managing, and participating in NGO activities.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-semibold">Data-Driven Insights</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  Leverage analytics and reports to improve your NGO activities. Identify trends, optimize engagement, and make informed decisions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-semibold">Enhanced Collaboration</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  Volunteers and organizers can communicate effortlessly through dedicated chat rooms and multi-channel notifications.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        <LampDemo />
      </div>
    </div>
  );
}