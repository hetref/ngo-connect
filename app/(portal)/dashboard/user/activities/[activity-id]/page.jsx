"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Edit, Trash2, Bookmark } from "lucide-react"

const events = [
  {
    id: 1,
    title: "Beach Cleanup",
    date: "2023-08-15",
    location: "Sunny Beach",
    volunteers: 45,
    description: "Join us for a day of cleaning up our beautiful beaches and protecting marine life.",
    images: [
      "https://source.unsplash.com/random/800x600/?beach,cleanup",
      "https://source.unsplash.com/random/800x600/?ocean,plastic",
      "https://source.unsplash.com/random/800x600/?volunteer,beach",
    ],
  },
  {
    id: 2,
    title: "Food Drive",
    date: "2023-08-20",
    location: "Community Center",
    volunteers: 30,
    description: "Help us collect and distribute food to those in need in our community.",
    images: [
      "https://source.unsplash.com/random/800x600/?food,donation",
      "https://source.unsplash.com/random/800x600/?volunteer,foodbank",
      "https://source.unsplash.com/random/800x600/?community,help",
    ],
  },
  {
    id: 3,
    title: "Tree Planting",
    date: "2023-08-10",
    location: "City Park",
    volunteers: 60,
    description: "Let's make our city greener by planting trees in the local park.",
    images: [
      "https://source.unsplash.com/random/800x600/?tree,planting",
      "https://source.unsplash.com/random/800x600/?forest,sapling",
      "https://source.unsplash.com/random/800x600/?nature,conservation",
    ],
  },
]

export default function UserActivitiesPage() {
  const params = useParams()
  const eventId = parseInt(params["activity-id"])
  const event = events.find((e) => e.id === eventId)

  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h2 className="text-2xl font-semibold">Event not found</h2>
      </div>
    )
  }

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % event.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + event.images.length) % event.images.length)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto"
    >
      <Card className="overflow-hidden relative">
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <Button className="bg-[#1CAC78] hover:bg-[#158f63]">
            <Edit className="mr-2 h-4 w-4" /> Edit Event
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete Event
          </Button>
          <Button variant="outline" className="bg-white">
            <Bookmark className="mr-2 h-4 w-4" /> Bookmark
          </Button>
        </div>

        <div className="relative h-96">
          <img
            src={event.images[currentImageIndex] || "/placeholder.svg"}
            alt={`${event.title} - Image ${currentImageIndex + 1}`}
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-4 right-4 space-x-2">
            <Button variant="secondary" size="sm" onClick={prevImage}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" onClick={nextImage}>
              Next
            </Button>
          </div>
        </div>
        <CardHeader>
          <CardTitle className="text-3xl">{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-4 text-gray-500">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>{event.volunteers} volunteers</span>
            </div>
          </div>
          <p className="mb-6 text-gray-700">{event.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

