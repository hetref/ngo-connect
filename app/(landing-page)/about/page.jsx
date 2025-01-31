"use client";
import React from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Timeline } from "@/components/ui/timeline";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-blue-500">
          About Us
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-foreground/80 max-w-4xl">
          Empowering Institutions, Students, and Communities Through Seamless NGO Management
        </h2>
        <div className="max-w-3xl mx-auto space-y-6 text-lg text-muted-foreground">
          <p>

            At the heart of our platform lies a vision to revolutionize how NGOs organize, manage, and participate in events. We are a team of passionate innovators dedicated to building a smart, efficient, and secure solution tailored to the unique needs of NGOs.
          </p>
          <p>

            Our mission is to bridge the gap between technology and NGOs by offering a platform that simplifies NGO management while fostering engagement and collaboration among NGOs, institutions, and communities.
          </p>
        </div>
      </div>

      <BackgroundBeams />
      <Timeline />
    </div>
  );
}
// Compare this snippet from app/%28landing-page%29/about/page.jsx: