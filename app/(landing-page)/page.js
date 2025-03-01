"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { BackgroundLines } from "@/components/ui/background-lines"
import { FeaturesSectionDemo } from "@/components/feature"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import LampDemo from "@/components/ui/lamp"
import FloatingNavbar from "@/components/floating-navbar"

export default function Home() {
  const [isVisible, setIsVisible] = useState({
    features: false,
    whyChooseUs: false,
    lamp: false,
  })

  const featuresRef = useRef(null)
  const whyChooseUsRef = useRef(null)
  const lampRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === featuresRef.current) {
            setIsVisible((prev) => ({ ...prev, features: entry.isIntersecting }))
          } else if (entry.target === whyChooseUsRef.current) {
            setIsVisible((prev) => ({ ...prev, whyChooseUs: entry.isIntersecting }))
          } else if (entry.target === lampRef.current) {
            setIsVisible((prev) => ({ ...prev, lamp: entry.isIntersecting }))
          }
        })
      },
      { threshold: 0.1 },
    )

    if (featuresRef.current) observer.observe(featuresRef.current)
    if (whyChooseUsRef.current) observer.observe(whyChooseUsRef.current)
    if (lampRef.current) observer.observe(lampRef.current)

    return () => {
      if (featuresRef.current) observer.unobserve(featuresRef.current)
      if (whyChooseUsRef.current) observer.unobserve(whyChooseUsRef.current)
      if (lampRef.current) observer.unobserve(lampRef.current)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground overflow-x-hidden transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative min-h-screen">
        <FloatingNavbar />
        <BackgroundLines>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-6"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
            >
              <span className="text-foreground dark:text-white">Welcome to</span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-blue-500">
                NGO-Connect
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-muted-foreground dark:text-gray-300 max-w-2xl mb-10"
            >
              Streamline your NGO management process with our powerful platform
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/register"
                className="group relative px-8 py-4 bg-primary text-primary-foreground rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
              >
                <span className="relative z-10">Get Started</span>
                <span className="absolute inset-0 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0 opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-0 transition-all duration-700"></span>
              </Link>

              <Link
                href="/ngo"
                className="group px-8 py-4 border border-border rounded-lg hover:bg-accent/50 transition-all duration-300 hover:shadow-lg"
              >
                <span>Explore NGOs</span>
                <span className="inline-block ml-2 transform group-hover:translate-x-1 transition-transform duration-200">
                  →
                </span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 1 }}
              className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            >
              <div className="animate-bounce flex flex-col items-center text-muted-foreground">
                <span className="text-sm mb-2">Scroll to explore</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 5V19M12 19L5 12M12 19L19 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </motion.div>
          </motion.div>
        </BackgroundLines>
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="relative bg-background dark:bg-black py-16 z-10 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible.features ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center mb-16 relative"
        >
          {/* Decorative lines */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-40 h-40">
            <div className="absolute top-0 left-1/2 w-[1px] h-20 bg-purple-500/20 dark:bg-purple-400/20"></div>
            <div className="absolute bottom-0 left-1/2 w-[1px] h-20 bg-purple-500/20 dark:bg-purple-400/20"></div>
            <div className="absolute left-0 top-1/2 h-[1px] w-20 bg-purple-500/20 dark:bg-purple-400/20"></div>
            <div className="absolute right-0 top-1/2 h-[1px] w-20 bg-purple-500/20 dark:bg-purple-400/20"></div>
          </div>

          {/* Button with spinning border */}
          <div className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none bg-primary/20">
            <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-background dark:bg-black px-8 py-1 text-lg font-medium text-foreground dark:text-white">
              Features
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible.features ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <FeaturesSectionDemo />
        </motion.div>

        {/* Why Choose Us Section */}
        <div ref={whyChooseUsRef} className="mt-24 mb-16 transition-colors duration-300">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible.whyChooseUs ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center mb-16 relative"
          >
            {/* Decorative lines */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-40 h-40">
              <div className="absolute top-0 left-1/2 w-[1px] h-20 bg-purple-500/20 dark:bg-purple-400/20"></div>
              <div className="absolute bottom-0 left-1/2 w-[1px] h-20 bg-purple-500/20 dark:bg-purple-400/20"></div>
              <div className="absolute left-0 top-1/2 h-[1px] w-20 bg-purple-500/20 dark:bg-purple-400/20"></div>
              <div className="absolute right-0 top-1/2 h-[1px] w-20 bg-purple-500/20 dark:bg-purple-400/20"></div>
            </div>

            {/* Button with spinning border */}
            <div className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none bg-primary/20">
              <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-background dark:bg-black px-8 py-1 text-lg font-medium text-foreground dark:text-white">
                Why Choose Us?
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible.whyChooseUs ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-3xl mx-auto px-4 sm:px-6"
          >
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  id: "item-1",
                  title: "Efficiency Meets Innovation",
                  content:
                    "From AI-driven validation to QR-based attendance and e-certificates, our platform eliminates inefficiencies, making NGO management smarter and faster.",
                },
                {
                  id: "item-2",
                  title: "Comprehensive Tools for Every User",
                  content:
                    "Whether you're an admin, member, or student, our tailored tools ensure a seamless experience for organizing, managing, and participating in NGO activities.",
                },
                {
                  id: "item-3",
                  title: "Data-Driven Insights",
                  content:
                    "Leverage analytics and reports to improve your NGO activities. Identify trends, optimize engagement, and make informed decisions.",
                },
                {
                  id: "item-4",
                  title: "Enhanced Collaboration",
                  content:
                    "Volunteers and organizers can communicate effortlessly through dedicated chat rooms and multi-channel notifications.",
                },
              ].map((item, index) => (
                <AccordionItem 
                  value={item.id} 
                  key={item.id} 
                  className="border-b border-border/50 dark:border-gray-700"
                >
                  <AccordionTrigger className="text-left py-6 group">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors dark:bg-primary/20 dark:group-hover:bg-primary/30">
                        <span className="font-semibold">{index + 1}</span>
                      </div>
                      <span className="text-lg font-semibold group-hover:text-primary transition-colors dark:text-white">
                        {item.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-14 text-muted-foreground dark:text-gray-300 text-base leading-relaxed">
                    {item.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>

      {/* Lamp Demo Section */}
      <div ref={lampRef} className="relative bg-background dark:bg-black transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isVisible.lamp ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          <LampDemo />
        </motion.div>
      </div>
    </div>
  )
}

