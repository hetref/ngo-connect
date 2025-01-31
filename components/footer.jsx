'use client'

import { motion } from "framer-motion"
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react'
import Link from "next/link"

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { name: "Features", href: "#" },
      { name: "Pricing", href: "#" },
      { name: "Testimonials", href: "#" },
      { name: "Integration", href: "#" },
    ],
  },
  integrations: {
    title: "Integrations",
    links: [
      { name: "Facebook", href: "#" },
      { name: "Instagram", href: "#" },
      { name: "Twitter", href: "#" },
      { name: "LinkedIn", href: "#" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { name: "Blog", href: "#" },
      { name: "Support", href: "#" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { name: "About Us", href: "#" },
      { name: "Privacy Policy", href: "#" },
      { name: "Terms & Conditions", href: "#" },
    ],
  },
}

export function Footer() {
  return (
    <footer className="relative bg-black text-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <motion.div 
            className="space-y-4"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Link href="/" className="flex items-center space-x-2">
              <div className="rounded bg-purple-500/10 p-2">
                <div className="h-6 w-6 text-purple-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                    <path d="M2 2l7.586 7.586" />
                    <path d="M11 11l4 4" />
                  </svg>
                </div>
              </div>
            </Link>
            <p className="text-sm leading-6 text-gray-300">
              Manage your links with ease.
            </p>
            <p className="text-sm leading-6 text-gray-300">
              Made by NGO-Connect
            </p>
          </motion.div>
          
          <motion.div 
            className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">{footerLinks.product.title}</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerLinks.product.links.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm leading-6 text-gray-300 hover:text-white transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">{footerLinks.integrations.title}</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerLinks.integrations.links.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm leading-6 text-gray-300 hover:text-white transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">{footerLinks.resources.title}</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerLinks.resources.links.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm leading-6 text-gray-300 hover:text-white transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">{footerLinks.company.title}</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerLinks.company.links.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm leading-6 text-gray-300 hover:text-white transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <p className="text-sm leading-5 text-gray-400">
            © 2025 NGO-Connect. All rights reserved.
          </p>
        </motion.div>


        {/* Watermark */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 select-none">
          <h2 className="text-[20vw] font-bold text-white/[0.02] leading-none">
            NGO-Connect
          </h2>
        </div>
      </div>

    </footer>
  )
}
