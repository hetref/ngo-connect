"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Filter, Calendar, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { FileText } from "lucide-react"

export default function NGOInventoryPage() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const activitiesCollection = collection(db, "activities");
        const activitiesSnapshot = await getDocs(activitiesCollection);

        const activitiesData = [];

        for (const docSnapshot of activitiesSnapshot.docs) {
          const activityDoc = docSnapshot.data();
          const activityId = docSnapshot.id; // Get the activity ID
          const inventoryCollection = collection(db, "activities", activityId, "inventory"); // Correct path

          const inventorySnapshot = await getDocs(inventoryCollection);
          const inventoryData = inventorySnapshot.docs.map(inventoryDoc => inventoryDoc.data());

          activitiesData.push({
            id: activityId, // Store the activity ID
            ...activityDoc,
            inventory: inventoryData, // Add the inventory data
          });
        }

        console.log("Fetched activities with inventory:", activitiesData);
        setEvents(activitiesData);

      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Filter activities based on search term and status
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.eventName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || event.status?.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-5xl font-bold mb-8">NGO Inventory Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Event-Wise Inventory Listing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-[#1CAC78] hover:bg-[#158f63]">
              <FileText className="mr-2 h-4 w-4" /> Generate PDF Report
            </Button>
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
                  <TableCell className="font-medium">{event.eventName || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      {event.eventDate || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4" />
                      {event.location || "N/A"}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        event.status === "Upcoming" ? "outline" : event.status === "Ongoing" ? "default" : "secondary"
                      }
                    >
                      {event.status || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild>
                      <Link href={`/dashboard/ngo/inventory/analytics/${event.id}`}>View Inventory</Link>
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
