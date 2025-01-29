"use client"

import { motion} from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Users } from "lucide-react"

const events = [
  {
    id: 1,
    title: "Beach Cleanup",
    date: "2023-08-15",
    location: "Sunny Beach",
    volunteers: 45,
    image: "https://source.unsplash.com/random/800x600/?beach",
  },
  {
    id: 2,
    title: "Food Drive",
    date: "2023-08-20",
    location: "Community Center",
    volunteers: 30,
    image: "https://source.unsplash.com/random/800x600/?food",
  },
  {
    id: 3,
    title: "Tree Planting",
    date: "2023-08-10",
    location: "City Park",
    volunteers: 60,
    image: "https://source.unsplash.com/random/800x600/?tree",
  },
]

export default function NGOActivitiesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto"
    >
      <h1 className="mb-8 text-3xl font-bold">Activity Management</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href={`/dashboard/ngo/activities/${event.id}`}>
              <Card className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg">

                <img src={event.image || "/placeholder.svg"} alt={event.title} className="h-48 w-full object-cover" />
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{event.volunteers} volunteers</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

