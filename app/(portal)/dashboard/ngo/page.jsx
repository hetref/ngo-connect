"use client"

import { motion } from "framer-motion"
import { MetricsOverview } from "@/components/metrics-overview"
import { QuickActions } from "@/components/quick-actions"
import { RecentActivities } from "@/components/recent-activities"
import { EventInsights } from "@/components/event-insights"
import { ReportsSection } from "@/components/reports-section"
import { SponsorshipOverview } from "@/components/sponsorship-overview"
import { Notifications } from "@/components/notifications"
import { SearchAndFilters } from "@/components/search-and-filters"

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto"
    >
      <h1 className="mb-8 text-3xl font-bold md:text-4xl">NGO Dashboard (ngo name will come here)</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-full">
          <SearchAndFilters />
        </div>
        <div className="col-span-full sm:col-span-2 lg:col-span-4">
          <MetricsOverview />
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <QuickActions />
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <RecentActivities />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <EventInsights />
        </div>
        <div className="sm:col-span-1">
          <ReportsSection />
        </div>
        <div className="sm:col-span-1">
          <SponsorshipOverview />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <Notifications />
        </div>
      </div>
    </motion.div>
  )
}

