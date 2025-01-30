"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Calendar, MapPin, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

// Mock data for demonstration
const mockEvents = [
  {
    id: 1,
    name: "Beach Cleanup",
    date: "2023-08-15",
    location: "Mumbai Beach",
    ngo: "Clean Oceans",
    slotsAvailable: 20,
  },
  {
    id: 2,
    name: "Tree Planting Drive",
    date: "2023-08-20",
    location: "Delhi Park",
    ngo: "Green Earth",
    slotsAvailable: 50,
  },
  {
    id: 3,
    name: "Food Distribution",
    date: "2023-08-25",
    location: "Bangalore Slums",
    ngo: "Feeding India",
    slotsAvailable: 30,
  },
]

const trendingEvents = [
  { id: 4, name: "Marathon for Education", date: "2023-09-01", location: "Chennai", ngo: "Educate All" },
  { id: 5, name: "Blood Donation Camp", date: "2023-09-05", location: "Kolkata", ngo: "LifeSavers" },
]

export default function SearchActivitiesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [location, setLocation] = useState("")
  const [ngoRating, setNgoRating] = useState([4])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-3xl font-bold mb-8">Search Activities</h1>

      <Card>
        <CardHeader>
          <CardTitle>Search and Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search NGOs, events, or causes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="environment">Environment</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="past">Past Events</SelectItem>
              </SelectContent>
            </Select>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mumbai">Mumbai</SelectItem>
                <SelectItem value="delhi">Delhi</SelectItem>
                <SelectItem value="bangalore">Bangalore</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <label className="text-sm font-medium">NGO Rating</label>
              <Slider value={ngoRating} onValueChange={setNgoRating} max={5} step={1} className="w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold">{event.name}</h3>
                  <p className="text-sm text-gray-500">{event.ngo}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                    <MapPin className="w-4 h-4 ml-2" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{event.slotsAvailable} slots available</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trending Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendingEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{event.name}</h3>
                <p className="text-sm text-gray-500">{event.ngo}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-2">
                  <Calendar className="w-4 h-4" />
                  <span>{event.date}</span>
                  <MapPin className="w-4 h-4 ml-2" />
                  <span>{event.location}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button className="bg-[#1CAC78] hover:bg-[#158f63]">Join an Event Now!</Button>
      </div>
    </motion.div>
  )
}

