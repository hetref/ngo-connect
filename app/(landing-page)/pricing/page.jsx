'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Check, CreditCard } from 'lucide-react'

const pricingTiers = [
  {
    name: "Basic",
    price: {
      monthly: 0,
      yearly: 0
    },
    description: "For small events",
    features: ["Basic features"],
    cta: {
      text: "Get Started",
      action: () => {}
    }
  },
  {
    name: "Pro",
    price: {
      monthly: 29,
      yearly: 290
    },
    description: "For growing organizations",
    features: ["Pro features"],
    cta: {
      text: "Start Trial",
      action: () => {}
    },
    highlight: true
  },
  {
    name: "Enterprise",
    price: {
      monthly: 99,
      yearly: 990
    },
    description: "For large institutions",
    features: ["Enterprise features"],
    cta: {
      text: "Contact Us",
      action: () => {}
    }
  }
];

function Feature({ children }) {
  return (
    <li className="flex gap-x-3">
      <Check className="h-6 w-5 flex-none text-emerald-500" />
      {children}
    </li>
  )
}

export default function PricingPage({ title, subtitle }) {
  const [isMonthly, setIsMonthly] = useState(true)

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <button className="relative inline-flex h-9 w-48 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-100" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
              Simple Pricing
            </span>
          </button>
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            {subtitle}
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <div className="flex items-center gap-4 rounded-full p-1 bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <button
                onClick={() => setIsMonthly(true)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                  isMonthly ? 'bg-emerald-500 text-white' : 'text-gray-400'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsMonthly(false)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                  !isMonthly ? 'bg-emerald-500 text-white' : 'text-gray-400'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-3xl p-8 ring-1 ${
                tier.highlight 
                  ? 'ring-2 ring-emerald-500 bg-black/40 backdrop-blur-sm relative' 
                  : 'ring-white/10 bg-black/40 backdrop-blur-sm'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 px-4 py-1 text-sm font-semibold text-white shadow-lg">
                    Popular
                  </div>
                </div>
              )}
              <h3 className="text-emerald-300 text-lg font-semibold leading-8">{tier.name}</h3>
              <p className="mt-1 text-sm leading-6 text-gray-300">{tier.description}</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-white">
                  ${isMonthly ? tier.price.monthly : tier.price.yearly}
                </span>
                <span className="text-sm font-semibold leading-6 text-gray-300">
                  /{isMonthly ? 'month' : 'year'}
                </span>
              </p>
              <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-300">
                {tier.features.map((feature, featureIndex) => (
                  <Feature key={featureIndex}>{feature}</Feature>
                ))}
              </ul>
              <div className="mt-8">
                <Button 
                  onClick={tier.cta.action}
                  className={`w-full ${
                    tier.highlight
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:opacity-90'
                      : 'bg-emerald-500/10 text-white border-emerald-500/20 hover:bg-emerald-500/20'
                  }`}
                  variant={tier.highlight ? "default" : "outline"}
                >
                  {tier.cta.text}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex items-center justify-center gap-2 text-gray-400">
          <CreditCard className="h-5 w-5 text-emerald-500" />
          <span className="text-sm">No credit card required</span>
        </div>
      </div>
    </div>
  )
}