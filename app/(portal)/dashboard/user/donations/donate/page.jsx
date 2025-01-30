"use client"

import { motion } from "framer-motion"
import { Download, FileText, BarChart, MessageCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Mock data for demonstration
const donationOverview = {
  totalDonations: 25000,
  sponsoredEvents: 5,
  upcomingRecurring: 1000,
}

const recentDonations = [
  { id: 1, ngo: "Clean Oceans", amount: 5000, date: "2023-07-15", method: "UPI", status: "Completed" },
  { id: 2, ngo: "Green Earth", amount: 3000, date: "2023-06-20", method: "Credit Card", status: "Completed" },
  { id: 3, ngo: "Feeding India", amount: 2000, date: "2023-05-10", method: "Net Banking", status: "Pending" },
]

const sponsoredEvents = [
  { id: 1, name: "Annual Fundraiser", ngo: "Education for All", amount: 10000, date: "2023-08-01" },
  { id: 2, name: "Marathon for Health", ngo: "Health First", amount: 5000, date: "2023-09-15" },
]

const impactData = [
  { month: "Jan", beneficiaries: 50 },
  { month: "Feb", beneficiaries: 80 },
  { month: "Mar", beneficiaries: 120 },
  { month: "Apr", beneficiaries: 200 },
  { month: "May", beneficiaries: 180 },
  { month: "Jun", beneficiaries: 250 },
]

export default function UserDonatePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-3xl font-bold mb-8">Donations</h1>

      <Card>
        <CardHeader>
          <CardTitle>Donations Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold">₹{donationOverview.totalDonations}</h3>
              <p className="text-gray-500">Total Donations Made</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">{donationOverview.sponsoredEvents}</h3>
              <p className="text-gray-500">Total Sponsored Events</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">₹{donationOverview.upcomingRecurring}</h3>
              <p className="text-gray-500">Upcoming Recurring Donations</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Tax Receipt
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NGO</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDonations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell>{donation.ngo}</TableCell>
                  <TableCell>₹{donation.amount}</TableCell>
                  <TableCell>{donation.date}</TableCell>
                  <TableCell>{donation.method}</TableCell>
                  <TableCell>
                    <Badge variant={donation.status === "Completed" ? "default" : "secondary"}>{donation.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      View Receipt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sponsored Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sponsoredEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold">{event.name}</h3>
                  <p className="text-sm text-gray-500">{event.ngo}</p>
                  <p className="text-sm">Amount: ₹{event.amount}</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with NGO
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Impact Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={impactData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="beneficiaries" stroke="#1CAC78" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center mt-4 text-gray-500">Number of beneficiaries helped over time</p>
        </CardContent>
      </Card>

      <div className="text-center space-x-4">
        <Button className="bg-[#1CAC78] hover:bg-[#158f63]">Donate to a Cause Now!</Button>
        <Button variant="outline">Find Events to Sponsor!</Button>
      </div>
    </motion.div>
  )
}

