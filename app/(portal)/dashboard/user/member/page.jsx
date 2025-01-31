"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"

// Mock data for demonstration
const ngoInfo = {
  name: "Green Earth Initiative",
  logo: "/placeholder.svg?height=50&width=50",
  dateJoined: "2023-01-15",
  totalEventsParticipated: 12,
  totalHoursVolunteered: 48,
}

const events = [
  {
    id: 1,
    name: "Community Clean-up",
    date: "2025-01-15",
    location: "City Park",
    status: "Assigned",
  },
  {
    id: 2,
    name: "Tree Plantation Drive",
    date: "2024-12-10",
    location: "Riverside",
    status: "Not Assigned",
  },
  // Add more events as needed
]

export default function UserMemberPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortOrder, setSortOrder] = useState("asc")
  const router = useRouter()

  const filteredEvents = events
    .filter((event) => {
      const matchesSearch =
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.date.includes(searchTerm) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.status.toLowerCase().includes(searchTerm.toLowerCase())

      if (filterStatus === "all") return matchesSearch
      return matchesSearch && event.status.toLowerCase() === filterStatus.toLowerCase()
    })
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return new Date(a.date) - new Date(b.date)
      } else {
        return new Date(b.date) - new Date(a.date)
      }
    })

  const handleViewEvent = (eventId) => {
    router.push(`/dashboard/user/member/${eventId}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-3xl font-bold mb-8">NGO Membership</h1>

      {/* Header Section: NGO Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center space-x-4">
          <img src={ngoInfo.logo || "/placeholder.svg"} alt={ngoInfo.name} className="w-16 h-16 rounded-full" />
          <div>
            <CardTitle>{ngoInfo.name}</CardTitle>
            <p className="text-sm text-muted-foreground">Your Role: Member</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Date Joined: {ngoInfo.dateJoined}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Total Events Participated: {ngoInfo.totalEventsParticipated}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Total Hours Volunteered: {ngoInfo.totalHoursVolunteered}</span>
          </div>
        </CardContent>
        <CardContent>
          <Button className="w-full md:w-auto">View My Participation Details</Button>
        </CardContent>
      </Card>

      {/* Event List */}
      <Card>
        <CardHeader>
          <CardTitle>Event List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="assigned">Assigned to Me</SelectItem>
                <SelectItem value="not assigned">Not Assigned to Me</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Sort by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Upcoming → Past</SelectItem>
                <SelectItem value="desc">Past → Upcoming</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.name}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>
                    <Badge variant={event.status === "Assigned" ? "default" : "secondary"}>{event.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleViewEvent(event.id)}>
                      View Event
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  )
}

