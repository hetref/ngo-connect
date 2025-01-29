"use client"

import { motion } from "framer-motion"
import { PersonalOverview } from "@/components/user-dashboard/personal-overview"
import { VolunteerActivities } from "@/components/user-dashboard/volunteer-activities"
import { DonationInsights } from "@/components/user-dashboard/donation-insights"
import { SuggestedOpportunities } from "@/components/user-dashboard/suggested-opportunities"
import { NotificationsPanel } from "@/components/user-dashboard/notifications-panel"
import { CallToActions } from "@/components/user-dashboard/call-to-actions"

export default function UserDashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-3xl font-bold mb-8">User Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="md:col-span-2 lg:col-span-3">
          <PersonalOverview />
        </div>
        <div className="md:col-span-2 space-y-8">
          <VolunteerActivities />
          <DonationInsights />
        </div>
        <div className="md:col-span-2 lg:col-span-1 space-y-8">
          <NotificationsPanel />
          <CallToActions />
          <SuggestedOpportunities />
        </div>
      </div>
    </motion.div>
  )
}

