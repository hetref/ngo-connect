"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Upload, Filter, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data for demonstration
const activityData = {
  id: "1",
  title: "Community Clean-up",
  description: "Join us for a day of cleaning up our local park and making our community a better place!",
  assignedTo: "John Doe",
  startDate: "2025-02-01",
  endDate: "2025-02-02",
  volunteersAccepted: 20,
  participantsAccepted: 50,
}

const volunteers = [
  { name: "John Doe", role: "Coordinator", email: "john@example.com", phone: "+91 1234567890", status: "Active" },
  { name: "Aisha Khan", role: "Participant", email: "aisha@example.com", phone: "+91 9876543210", status: "Inactive" },
]

const participants = [
  { name: "Rahul Mehta", email: "rahul@example.com", phone: "+91 5555555555", checkedIn: true },
  { name: "Priya Sharma", email: "priya@example.com", phone: "+91 6666666666", checkedIn: false },
]

const images = [
  "/placeholder.svg?height=200&width=200",
  "/placeholder.svg?height=200&width=200",
  "/placeholder.svg?height=200&width=200",
]

const expenses = [
  { name: "Venue Booking", amount: 5000, date: "2025-02-01", receiptUploaded: true, status: "Approved" },
  { name: "Food Expenses", amount: 3000, date: "2025-02-02", receiptUploaded: false, status: "Pending" },
]

export default function MemberActivityPage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [activity, setActivity] = useState(activityData)

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    setIsEditing(false)
    // Here you would typically save the changes to your backend
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setActivity({ ...activity, [name]: value })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-3xl font-bold mb-8">Member Activity</h1>

      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            {isEditing ? (
              <Input name="title" value={activity.title} onChange={handleInputChange} className="text-2xl font-bold" />
            ) : (
              activity.title
            )}
            {isEditing ? (
              <Button onClick={handleSave}>Save Changes</Button>
            ) : (
              <Button onClick={handleEdit}>Edit Details</Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Description</Label>
              {isEditing ? (
                <Textarea
                  name="description"
                  value={activity.description}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              ) : (
                <p>{activity.description}</p>
              )}
            </div>
            <div>
              <Label>Assigned To</Label>
              {isEditing ? (
                <Select
                  name="assignedTo"
                  value={activity.assignedTo}
                  onValueChange={(value) => handleInputChange({ target: { name: "assignedTo", value } })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="John Doe">John Doe</SelectItem>
                    <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p>{activity.assignedTo}</p>
              )}
            </div>
            <div>
              <Label>Start Date</Label>
              {isEditing ? (
                <Input
                  type="date"
                  name="startDate"
                  value={activity.startDate}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              ) : (
                <p>{activity.startDate}</p>
              )}
            </div>
            <div>
              <Label>End Date</Label>
              {isEditing ? (
                <Input
                  type="date"
                  name="endDate"
                  value={activity.endDate}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              ) : (
                <p>{activity.endDate}</p>
              )}
            </div>
            <div>
              <Label>Duration</Label>
              <p>
                {Math.ceil((new Date(activity.endDate) - new Date(activity.startDate)) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>
            <div>
              <Label>Volunteers Accepted</Label>
              {isEditing ? (
                <Input
                  type="number"
                  name="volunteersAccepted"
                  value={activity.volunteersAccepted}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              ) : (
                <p>{activity.volunteersAccepted}</p>
              )}
            </div>
            <div>
              <Label>Participants Accepted</Label>
              {isEditing ? (
                <Input
                  type="number"
                  name="participantsAccepted"
                  value={activity.participantsAccepted}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              ) : (
                <p>{activity.participantsAccepted}</p>
              )}
            </div>
          </div>
          <Button 
            className="w-full md:w-auto mt-4" 
            onClick={() => router.push(`/dashboard/user/member/${activity.id}/scan`)}
          >
            Scan QR Code
          </Button>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="volunteers">
        <TabsList>
          <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="gallery">Image Gallery</TabsTrigger>
          <TabsTrigger value="payout">Payout Table</TabsTrigger>
        </TabsList>

        <TabsContent value="volunteers">
          <Card>
            <CardHeader>
              <CardTitle>Volunteer List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <Input placeholder="Search volunteers..." className="max-w-sm" />
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Volunteer Name</TableHead>
                    <TableHead>Role in Event</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {volunteers.map((volunteer, index) => (
                    <TableRow key={index}>
                      <TableCell>{volunteer.name}</TableCell>
                      <TableCell>{volunteer.role}</TableCell>
                      <TableCell>{volunteer.email}</TableCell>
                      <TableCell>{volunteer.phone}</TableCell>
                      <TableCell>
                        <Badge variant={volunteer.status === "Active" ? "default" : "secondary"}>
                          {volunteer.status === "Active" ? (
                            <CheckCircle className="mr-1 h-4 w-4" />
                          ) : (
                            <XCircle className="mr-1 h-4 w-4" />
                          )}
                          {volunteer.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>Participants List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <Input placeholder="Search participants..." className="max-w-sm" />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Checked In?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant, index) => (
                    <TableRow key={index}>
                      <TableCell>{participant.name}</TableCell>
                      <TableCell>{participant.email}</TableCell>
                      <TableCell>{participant.phone}</TableCell>
                      <TableCell>
                        <Badge variant={participant.checkedIn ? "default" : "secondary"}>
                          {participant.checkedIn ? (
                            <CheckCircle className="mr-1 h-4 w-4" />
                          ) : (
                            <XCircle className="mr-1 h-4 w-4" />
                          )}
                          {participant.checkedIn ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Image Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Event image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button variant="destructive" size="sm" className="absolute top-2 right-2">
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
              <Button className="mt-4">
                <Upload className="mr-2 h-4 w-4" /> Upload New Image
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payout">
          <Card>
            <CardHeader>
              <CardTitle>Payout Table</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense Name</TableHead>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense, index) => (
                    <TableRow key={index}>
                      <TableCell>{expense.name}</TableCell>
                      <TableCell>₹{expense.amount}</TableCell>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>
                        {expense.receiptUploaded ? (
                          <Badge variant="default">
                            <CheckCircle className="mr-1 h-4 w-4" /> Uploaded
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="mr-1 h-4 w-4" /> Not Uploaded
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={expense.status === "Approved" ? "default" : "secondary"}>
                          {expense.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button className="mt-4" onClick={() => router.push(`/dashboard/user/member/${activity.id}/payout`)}>Request Payout</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

