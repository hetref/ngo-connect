"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Filter, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for demonstration
const donationRequests = [
  {
    id: 1,
    ngoName: "Education for All",
    logo: "/placeholder.svg?height=50&width=50",
    title: "Help Build a School in Rural India",
    description: "Support our mission to bring quality education to underprivileged children in rural areas.",
    raised: 50000,
    goal: 100000,
    daysLeft: 30,
    urgency: "Ongoing",
  },
  {
    id: 2,
    ngoName: "Green Earth Initiative",
    logo: "/placeholder.svg?height=50&width=50",
    title: "Plant 10,000 Trees in Urban Areas",
    description: "Join our efforts to increase green cover and combat air pollution in cities.",
    raised: 75000,
    goal: 150000,
    daysLeft: 15,
    urgency: "Urgent",
  },
  {
    id: 3,
    ngoName: "Health for All Foundation",
    logo: "/placeholder.svg?height=50&width=50",
    title: "Provide Medical Supplies to Rural Clinics",
    description: "Help us equip rural health clinics with essential medical supplies and equipment.",
    raised: 30000,
    goal: 80000,
    daysLeft: 45,
    urgency: "Ongoing",
  },
]

export default function DonationRequestsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState("")
  const [urgency, setUrgency] = useState("")
  const [location, setLocation] = useState("")
  const [amountRange, setAmountRange] = useState([0, 200000])

  const scrollToRequests = () => {
    const requestsSection = document.getElementById("donation-requests")
    if (requestsSection) {
      requestsSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      {/* Header Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Support a Cause & Make a Difference!</h1>
        <p className="text-xl mb-8">Browse donation requests from verified NGOs and contribute to meaningful causes.</p>
        <Button size="lg" onClick={scrollToRequests} className="bg-[#1CAC78] hover:bg-[#158f63]">
          Start Donating
          <ArrowDown className="ml-2 h-4 w-4" />
        </Button>
      </section>

      {/* Filters & Search Bar */}
      <section className="bg-gray-100 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-grow">
            <Input
              placeholder="Search donation requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button className="bg-[#1CAC78] hover:bg-[#158f63]">
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
              <SelectItem value="disaster">Disaster Relief</SelectItem>
            </SelectContent>
          </Select>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger>
              <SelectValue placeholder="Urgency Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immediate</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="future">Future Needs</SelectItem>
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="north">North India</SelectItem>
              <SelectItem value="south">South India</SelectItem>
              <SelectItem value="east">East India</SelectItem>
              <SelectItem value="west">West India</SelectItem>
            </SelectContent>
          </Select>
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount Needed Range</label>
            <Slider value={amountRange} onValueChange={setAmountRange} max={200000} step={1000} className="w-full" />
            <div className="flex justify-between text-sm text-gray-500">
              <span>₹{amountRange[0]}</span>
              <span>₹{amountRange[1]}</span>
            </div>
          </div>
        </div>
        <Button className="mt-4 bg-[#1CAC78] hover:bg-[#158f63]">
          <Filter className="mr-2 h-4 w-4" /> Find Urgent Causes!
        </Button>
      </section>

      {/* Donation Requests List */}
      <section id="donation-requests" className="space-y-6">
        <h2 className="text-2xl font-bold">Donation Requests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donationRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <img
                    src={request.logo || "/placeholder.svg"}
                    alt={`${request.ngoName} logo`}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <CardTitle className="text-lg">{request.ngoName}</CardTitle>
                    <Badge variant={request.urgency === "Urgent" ? "destructive" : "secondary"}>
                      {request.urgency}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-semibold mb-2">{request.title}</h3>
                <p className="text-gray-600 mb-4">{request.description}</p>
                <div className="space-y-2">
                  <Progress value={(request.raised / request.goal) * 100} />
                  <div className="flex justify-between text-sm">
                    <span>₹{request.raised} raised</span>
                    <span>₹{request.goal} goal</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">{request.daysLeft} days left</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-[#1CAC78] hover:bg-[#158f63]">Donate Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured & Urgent Causes Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Featured & Urgent Causes</h2>
        <Tabs defaultValue="urgent">
          <TabsList>
            <TabsTrigger value="urgent">Urgent Causes</TabsTrigger>
            <TabsTrigger value="trending">Trending Campaigns</TabsTrigger>
          </TabsList>
          <TabsContent value="urgent">
            {/* Add urgent causes content here */}
            <p>Urgent causes will be displayed here.</p>
          </TabsContent>
          <TabsContent value="trending">
            {/* Add trending campaigns content here */}
            <p>Trending campaigns will be displayed here.</p>
          </TabsContent>
        </Tabs>
      </section>

      {/* Impact Stories & Testimonials */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Impact Stories & Testimonials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Donor Success Story</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                "Thanks to the generous donations, we were able to provide clean water to an entire village. The impact
                has been life-changing for the community." - John Doe, Water for All NGO
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>NGO Testimonial</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                "The support we received helped us set up a mobile health clinic that now serves over 1000 patients
                monthly in remote areas." - Dr. Jane Smith, Healthcare on Wheels
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center py-12">
        <h2 className="text-3xl font-bold mb-4">Start Your Impact – Donate Today!</h2>
        <p className="text-xl mb-8">Looking for a Specific Cause? Use Filters Above!</p>
        <Button size="lg" onClick={scrollToRequests} className="bg-[#1CAC78] hover:bg-[#158f63]">
          Browse Donation Requests
        </Button>
      </section>
    </motion.div>
  )
}

