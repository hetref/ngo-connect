"use client"

import { motion } from "framer-motion"
import { Calendar, MapPin, Award } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Mock data for demonstration
const volunteeringStats = {
  totalEvents: 15,
  totalHours: 75,
  topCauses: ["Environment", "Education", "Healthcare"],
}

const volunteeringHistory = [
  { id: 1, name: "Beach Cleanup", date: "2023-07-15", ngo: "Clean Oceans", role: "Volunteer", badge: "5x Volunteer" },
  {
    id: 2,
    name: "Tree Planting",
    date: "2023-06-20",
    ngo: "Green Earth",
    role: "Team Leader",
    badge: "Community Hero",
  },
  {
    id: 3,
    name: "Food Distribution",
    date: "2023-05-10",
    ngo: "Feeding India",
    role: "Coordinator",
    badge: "Impact Maker",
  },
]

export default function UserVolunteerPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-3xl font-bold mb-8">Volunteering History</h1>

      <Card>
        <CardHeader>
          <CardTitle>Total Volunteering Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold">{volunteeringStats.totalEvents}</h3>
              <p className="text-gray-500">Total Events</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">{volunteeringStats.totalHours}</h3>
              <p className="text-gray-500">Total Hours</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">{volunteeringStats.topCauses.join(", ")}</h3>
              <p className="text-gray-500">Top Causes Supported</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Volunteering History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {volunteeringHistory.map((event) => (
              <div key={event.id} className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold">{event.name}</h3>
                  <p className="text-sm text-gray-500">{event.ngo}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                    <Badge className="ml-2">{event.role}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">
                    <Award className="w-4 h-4 mr-1" />
                    {event.badge}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <Award className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <h3 className="font-semibold">5x Volunteer</h3>
              <p className="text-sm text-gray-500">Participated in 5 events</p>
            </div>
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <Award className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold">Community Hero</h3>
              <p className="text-sm text-gray-500">Led a team in an event</p>
            </div>
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <Award className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold">Impact Maker</h3>
              <p className="text-sm text-gray-500">Coordinated a major event</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button className="bg-[#1CAC78] hover:bg-[#158f63]">Join More Events!</Button>
      </div>
    </motion.div>
  )
}

