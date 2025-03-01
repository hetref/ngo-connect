"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import { doc, getDoc, collection, query, getDocs, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Image from "next/image"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Globe, MapPin, Users, Phone, Mail, Heart, Share2, Bookmark, ArrowUpRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import NGODetails from "@/components/ngo/single-ngo/NGODetails"
import NGOActivities from "@/components/NGOActivities"
import DonateNow from "@/components/ngo/single-ngo/DonateNow"

export default function SingleNGOPage() {
  const params = useParams()
  const ngoId = params["ngo-id"]
  const [ngo, setNgo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ethPrice, setEthPrice] = useState(0)
  const [activeTab, setActiveTab] = useState("details")
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  useEffect(() => {
    async function fetchNGO() {
      if (!ngoId) {
        console.log("No NGO ID provided")
        return
      }
      
      console.log("Fetching NGO with ID:", ngoId)
      
      try {
        const docRef = doc(db, "ngo", ngoId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const ngoData = docSnap.data()
          console.log("NGO Data found:", {
            id: ngoId,
            ...ngoData,
            bankDetails: ngoData.bankDetails || "No bank details available",
            location: ngoData.location || "No location specified",
            phone: ngoData.phone || "No phone specified",
            email: ngoData.email || "No email specified",
            website: ngoData.website || "No website specified",
            category: ngoData.category || "No category specified",
            verified: ngoData.verified || false,
            address: ngoData.address || "No address specified"
          })
          setNgo(ngoData)
        } else {
          console.log("No NGO found with ID:", ngoId)
          setNgo(null)
        }
      } catch (error) {
        console.error("Error fetching NGO:", error)
        console.log("Error details:", {
          message: error.message,
          code: error.code,
          stack: error.stack
        })
      } finally {
        setLoading(false)
      }
    }
    fetchNGO()
  }, [ngoId])

  useEffect(() => {
    async function fetchEthPrice() {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setEthPrice(data.ethereum.inr)
      } catch (error) {
        console.error("Error fetching ETH price:", error)
        setEthPrice(0)
      }
    }

    fetchEthPrice()
    const intervalId = setInterval(fetchEthPrice, 60000) // Update every minute

    return () => clearInterval(intervalId)
  }, [])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (!ngo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <h2 className="text-2xl font-semibold">NGO not found</h2>
        <p className="text-muted-foreground">The NGO you're looking for doesn't exist or has been removed.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 pt-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Hero and Info */}
        <div className="lg:col-span-2 space-y-6">
          <HeroSection ngo={ngo} />
          <InfoTabs 
            ngo={ngo} 
            ngoId={ngoId} 
            ethPrice={ethPrice} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
          />
        </div>

        {/* Right Column - Quick Actions and Stats */}
        <div className="space-y-6">
          <QuickActions 
            ngo={ngo} 
            onDonate={() => setActiveTab("donate")}
            onShare={() => setIsShareModalOpen(true)}
          />
          {/* Comment out NGOStats */}
          {/* <NGOStats ngo={ngo} /> */}
          {/* <RelatedNGOs /> */}
        </div>
      </div>

      {/* Add Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-0">
              <Skeleton className="h-[300px] w-full rounded-t-lg" />
              <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function HeroSection({ ngo }) {
  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <div className="relative h-[300px] w-full">
        <Image
          src={ngo.logoUrl || "/placeholder.svg?height=300&width=800"}
          alt={ngo.ngoName}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{ngo.ngoName}</h1>
          <div className="flex items-center gap-2 text-white/90">
            <MapPin className="h-4 w-4" />
            <span>{ngo.location || "Location not specified"}</span>
          </div>
          <div className="flex gap-2 mt-3">
            <Badge variant="secondary" className="bg-white/20 hover:bg-white/30">
              {ngo.category || "Charity"}
            </Badge>
            {ngo.verified && (
              <Badge variant="secondary" className="bg-blue-500/80 hover:bg-blue-500/90">
                Verified
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function InfoTabs({ ngo, ngoId, ethPrice, activeTab, setActiveTab }) {
  const [donationMethod, setDonationMethod] = useState("cash")
  
  // Get available donation methods
  const availableDonationMethods = ["cash"] // Cash is always available
  if (ngo.donationsData?.isCryptoTransferEnabled) availableDonationMethods.push("online")
  if (ngo.donationsData?.isBankTransferEnabled) availableDonationMethods.push("bank")

  // Set initial donation method to the first available method
  useEffect(() => {
    setDonationMethod(availableDonationMethods[0])
  }, [])
  
  return (
    <Card>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <CardHeader className="pb-0">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="donate">Donate</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className="pt-6">
          <TabsContent value="details" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <NGODetails ngo={ngo} ngoId={ngoId} />
            </motion.div>
          </TabsContent>
          <TabsContent value="activities" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <NGOActivities ngoId={ngoId} />
            </motion.div>
          </TabsContent>
          <TabsContent value="donate" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Tabs value={donationMethod} onValueChange={setDonationMethod} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  {/* Cash donation is always available */}
                  <TabsTrigger value="cash">Cash/Kind</TabsTrigger>
                  
                  {/* Show online/crypto tab if enabled */}
                  {ngo.donationsData?.isCryptoTransferEnabled && (
                    <TabsTrigger value="online">Online</TabsTrigger>
                  )}
                  
                  {/* Show bank transfer tab if enabled */}
                  {ngo.donationsData?.isBankTransferEnabled && (
                    <TabsTrigger value="bank">Bank</TabsTrigger>
                  )}
                </TabsList>
                
                {/* Cash donation content - always available */}
                <TabsContent value="cash" className="mt-0">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Cash/Kind Donation</h3>
                    <p className="text-muted-foreground">
                      You can visit our office at the following address to make a cash/kind donation:
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-medium">{ngo.ngoName}</p>
                      <p className="text-sm text-muted-foreground">{ngo.address || ngo.location}</p>
                      {ngo.phone && <p className="text-sm text-muted-foreground">Phone: {ngo.phone}</p>}
                    </div>
                  </div>
                </TabsContent>
                
                {/* Online/Crypto donation content - show if enabled */}
                {ngo.donationsData?.isCryptoTransferEnabled && (
                  <TabsContent value="online" className="mt-0">
                    <DonateNow ngoData={ngo} ethPrice={ethPrice} />
                  </TabsContent>
                )}
                
                {/* Bank transfer content - show if enabled */}
                {ngo.donationsData?.isBankTransferEnabled && (
                  <TabsContent value="bank" className="mt-0">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Bank Transfer</h3>
                      <p className="text-muted-foreground">
                        Please use the following bank details to make your donation:
                      </p>
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account Holder Name:</span>
                          <span className="font-medium">{ngo.donationsData?.bankTransferDetails?.accountHolderName || ngo.ngoName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bank Name:</span>
                          <span className="font-medium">{ngo.donationsData?.bankTransferDetails?.bankName || "Contact NGO for details"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Branch:</span>
                          <span className="font-medium">{ngo.donationsData?.bankTransferDetails?.branchName || "Contact NGO for details"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account Number:</span>
                          <span className="font-medium">{ngo.donationsData?.bankTransferDetails?.accountNumber || "Contact NGO for details"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account Type:</span>
                          <span className="font-medium">{ngo.donationsData?.bankTransferDetails?.accountType || "Savings"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IFSC Code:</span>
                          <span className="font-medium">{ngo.donationsData?.bankTransferDetails?.ifscCode || "Contact NGO for details"}</span>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> After making the transfer, please keep your transaction reference number for our records.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </motion.div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}

function QuickActions({ ngo, onDonate, onShare }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          className="w-full bg-primary hover:bg-primary/90 gap-2"
          onClick={onDonate}
        >
          <Heart className="h-4 w-4" />
          Donate Now
        </Button>
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{ngo.phone || "Not available"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{ngo.email || "Not available"}</span>
          </div>
          {ngo.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a
                href={ngo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                Visit website <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// function NGOStats({ ngo }) {
//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="text-lg">NGO Stats</CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         <div className="grid grid-cols-2 gap-4">
//           <div className="bg-muted/50 p-4 rounded-lg text-center">
//             <p className="text-2xl font-bold">{ngo.donorsCount || "0"}</p>
//             <p className="text-sm text-muted-foreground">Donors</p>
//           </div>
//           <div className="bg-muted/50 p-4 rounded-lg text-center">
//             <p className="text-2xl font-bold">{ngo.projectsCount || "0"}</p>
//             <p className="text-sm text-muted-foreground">Projects</p>
//           </div>
//         </div>
//         <div className="space-y-2">
//           <div className="flex justify-between text-sm">
//             <span className="text-muted-foreground">Founded</span>
//             <span className="font-medium">{ngo.foundedYear || "N/A"}</span>
//           </div>
//           <div className="flex justify-between text-sm">
//             <span className="text-muted-foreground">Volunteers</span>
//             <span className="font-medium">{ngo.volunteersCount || "N/A"}</span>
//           </div>
//           <div className="flex justify-between text-sm">
//             <span className="text-muted-foreground">Funds Raised</span>
//             <span className="font-medium">₹{ngo.fundsRaised?.toLocaleString() || "0"}</span>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

// function RelatedNGOs() {
//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="text-lg">Similar NGOs</CardTitle>
//         <CardDescription>Organizations with similar missions</CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {[1, 2, 3].map((i) => (
//           <div key={i} className="flex items-center gap-3">
//             <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
//               <Users className="h-5 w-5 text-muted-foreground" />
//             </div>
//             <div>
//               <p className="font-medium">Related NGO {i}</p>
//               <p className="text-xs text-muted-foreground">Similar category</p>
//             </div>
//           </div>
//         ))}
//         <Button variant="ghost" className="w-full text-sm" size="sm">
//           View More
//         </Button>
//       </CardContent>
//     </Card>
//   )
// }

function ShareModal({ isOpen, onClose, url }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share NGO</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={url}
              readOnly
            />
          </div>
          <Button 
            type="submit" 
            size="sm" 
            className="px-3"
            onClick={copyToClipboard}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}