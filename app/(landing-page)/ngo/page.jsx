"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  MapPin,
  Users,
  Globe,
  Search,
  Filter,
  Wallet,
  Phone,
  ArrowRight,
  Sparkles,
  X,
  ChevronDown,
  Plus,
  Grid,
  List as ListIcon,
} from "lucide-react"
import Image from "next/image"
import { db } from "@/lib/firebase"
import { collection, onSnapshot } from "firebase/firestore"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const NGO_CATEGORIES = [
  "Environmental",
  "Healthcare",
  "Education",
  "Animal Welfare",
  "Humanitarian",
  "Arts & Culture",
  "All",
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

const NGOListPage = () => {
  const [ngos, setNgos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showFilters, setShowFilters] = useState(false)
  const [activeView, setActiveView] = useState("grid")
  const [hoveredNgo, setHoveredNgo] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "ngo"),
      (ngoSnapshot) => {
        const ngoList = []

        ngoSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.isVerified === "verified") {
            ngoList.push({
              id: doc.id,
              ...data,
            })
          }
        })

        setNgos(ngoList)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching NGOs:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const filteredNGOs = ngos.filter((ngo) => {
    const matchesSearch =
      ngo.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.ngoName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || ngo.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDonate = (type, ngoId) => {
    console.log(`Donating ${type} to NGO ${ngoId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-gray-50 to-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: {
              duration: 0.5,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            },
          }}
          className="flex flex-col items-center"
        >
          <Sparkles className="h-16 w-16 text-emerald-600 mb-6" />
          <p className="font-semibold text-2xl text-emerald-600">Loading NGOs...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <motion.div
          className="relative h-[60vh] w-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <Image src="/coverbg.jpg" alt="NGO Cover" layout="fill" objectFit="cover" className="brightness-75" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
          <motion.div
            className="absolute inset-0 flex flex-col justify-center items-center text-white z-10 px-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <motion.span
              className="px-4 py-1 bg-emerald-600 rounded-full text-sm font-medium mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Make a Difference Today
            </motion.span>
            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-6 text-center leading-tight"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Discover & Support <span className="text-emerald-400">NGOs</span>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl max-w-2xl text-center text-gray-100 mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              Connect with organizations making a difference in the world and find meaningful ways to contribute
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex gap-4"
            >
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-emerald-500/20"
                onClick={() => {
                  const element = document.getElementById("ngo-list")
                  element?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                Explore NGOs <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="px-8 py-6 rounded-full text-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/30"
              >
                About Us
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-gray-50 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          />
        </motion.div>

        {/* Stats Summary */}
        <div className="w-full bg-white">
          <div className="container mx-auto py-12 px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
            </motion.div>
          </div>
        </div>

        {/* NGO Listing Section */}
        <div className="container mx-auto py-12 px-4" id="ngo-list">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-10 border border-gray-100"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Find Your Cause</h2>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search NGOs by name..."
                  className="pl-10 w-full border-2 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 h-12 rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-lg shadow-md hover:shadow-lg transition-all">
                    <Filter className="h-5 w-5" />
                    Filter by Category
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filter NGOs by Category</DialogTitle>
                    <DialogDescription>Select a category to filter the NGO list</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3 py-4">
                    {NGO_CATEGORIES.map((category) => (
                      <motion.div key={category} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <DialogClose asChild>
                          <Button
                            variant={selectedCategory === category ? "default" : "outline"}
                            onClick={() => {
                              setSelectedCategory(category)
                              setShowFilters(false)
                            }}
                            className={`w-full ${
                              selectedCategory === category ? "bg-emerald-600 hover:bg-emerald-700" : ""
                            }`}
                          >
                            {category}
                          </Button>
                        </DialogClose>
                      </motion.div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={activeView === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView("grid")}
                  className={activeView === "grid" ? "bg-emerald-600" : ""}
                >
                  <Grid className="h-4 w-4 mr-1" /> Grid
                </Button>
                <Button
                  variant={activeView === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView("list")}
                  className={activeView === "list" ? "bg-emerald-600" : ""}
                >
                  <ListIcon className="h-4 w-4 mr-1" /> List
                </Button>
              </div>
            </div>

            {selectedCategory !== "All" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center"
              >
                <Badge className="bg-emerald-600 text-white py-1 px-3">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory("All")} className="ml-2 hover:text-gray-200">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
                <span className="ml-2 text-sm text-gray-500">{filteredNGOs.length} NGOs found</span>
              </motion.div>
            )}
          </motion.div>

          {filteredNGOs.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No NGOs Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We couldn't find any NGOs matching your search criteria. Try adjusting your filters or search term.
              </p>
              <Button
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("All")
                }}
              >
                Clear Filters
              </Button>
            </motion.div>
          ) : activeView === "grid" ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence>
                {filteredNGOs.map((ngo) => (
                  <motion.div
                    key={ngo.id}
                    variants={itemVariants}
                    layout
                    whileHover={{ y: -5 }}
                    onHoverStart={() => setHoveredNgo(ngo.id)}
                    onHoverEnd={() => setHoveredNgo(null)}
                  >
                    <Card className="overflow-hidden h-full bg-white border-0 shadow-lg rounded-xl hover:shadow-xl transition-all duration-300">
                      <div className="relative h-56 overflow-hidden">
                        <Image
                          src={ngo?.logoUrl || "/placeholder.svg?height=400&width=600"}
                          alt={ngo.ngoName || "NGO Logo"}
                          layout="fill"
                          objectFit="cover"
                          className="transition-transform duration-500 ease-in-out"
                          style={{
                            transform: hoveredNgo === ngo.id ? "scale(1.05)" : "scale(1)",
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-emerald-600/90 hover:bg-emerald-600 text-white font-medium">
                            {ngo.category || "NGO"}
                          </Badge>
                        </div>
                      </div>

                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <Link
                            href={`/ngo/${ngo.id}`}
                            className="text-xl font-bold hover:text-emerald-600 transition-colors"
                          >
                            {ngo.ngoName || ngo.name}
                          </Link>

                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                                >
                                  <Wallet className="h-4 w-4 mr-1" />
                                  Donate
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => handleDonate("money", ngo.id)}
                                  className="cursor-pointer hover:bg-emerald-50"
                                >
                                  Donate Money
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDonate("resources", ngo.id)}
                                  className="cursor-pointer hover:bg-emerald-50"
                                >
                                  Donate Resources
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDonate("ethereum", ngo.id)}
                                  className="cursor-pointer hover:bg-emerald-50"
                                >
                                  Donate via Ethereum
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </motion.div>
                        </div>
                      </CardHeader>

                      <CardContent className="pb-4">
                        <div className="space-y-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-emerald-600" />
                            <span className="truncate">{ngo.email || "No email provided"}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-emerald-600" />
                            <span>{ngo.phone || "No phone provided"}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-emerald-600" />
                            <span className="truncate">{ngo.location || "No location provided"}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-emerald-600" />
                            <span>{ngo.memberCount || 0} members</span>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-0">
                        <Link
                          href={`/ngo/${ngo.id}`}
                          className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center transition-colors"
                        >
                          View Details
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
              <AnimatePresence>
                {filteredNGOs.map((ngo) => (
                  <motion.div key={ngo.id} variants={itemVariants} layout whileHover={{ y: -2 }}>
                    <Card className="overflow-hidden bg-white border-0 shadow-lg rounded-xl hover:shadow-xl transition-all duration-300">
                      <div className="flex flex-col md:flex-row">
                        <div className="relative w-full md:w-60 h-56 md:h-auto">
                          <Image
                            src={ngo?.logoUrl || "/placeholder.svg?height=400&width=400"}
                            alt={ngo.ngoName || "NGO Logo"}
                            layout="fill"
                            objectFit="cover"
                            className="md:rounded-l-xl"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:hidden" />
                          <div className="absolute top-3 left-3 md:hidden">
                            <Badge className="bg-emerald-600/90 hover:bg-emerald-600 text-white">
                              {ngo.category || "NGO"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex-1 p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <div>
                              <Badge className="mb-2 hidden md:inline-flex bg-emerald-600/90 hover:bg-emerald-600 text-white">
                                {ngo.category || "NGO"}
                              </Badge>
                              <h3 className="text-xl font-bold">
                                <Link href={`/ngo/${ngo.id}`} className="hover:text-emerald-600 transition-colors">
                                  {ngo.ngoName || ngo.name}
                                </Link>
                              </h3>
                            </div>

                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="mt-4 md:mt-0"
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                                  >
                                    <Wallet className="h-4 w-4 mr-2" />
                                    Donate
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() => handleDonate("money", ngo.id)}
                                    className="cursor-pointer hover:bg-emerald-50"
                                  >
                                    Donate Money
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDonate("resources", ngo.id)}
                                    className="cursor-pointer hover:bg-emerald-50"
                                  >
                                    Donate Resources
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDonate("ethereum", ngo.id)}
                                    className="cursor-pointer hover:bg-emerald-50"
                                  >
                                    Donate via Ethereum
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </motion.div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4 text-emerald-600" />
                              <span className="truncate">{ngo.email || "No email provided"}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-emerald-600" />
                              <span>{ngo.phone || "No phone provided"}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-emerald-600" />
                              <span className="truncate">{ngo.location || "No location provided"}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-emerald-600" />
                              <span>{ngo.memberCount || 0} members</span>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Link
                              href={`/ngo/${ngo.id}`}
                              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center transition-colors"
                            >
                              View Details
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </MotionConfig>
  )
}

export default NGOListPage