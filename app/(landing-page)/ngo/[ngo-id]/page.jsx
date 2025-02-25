"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, Users, Phone, Mail, Wallet } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NGODetails from "@/components/ngo/single-ngo/NGODetails";
import NGOActivities from "@/components/ngo/single-ngo/NGOActivities";
import DonateNowButton from "@/components/ngo/single-ngo/DonateNowButton";

export default function SingleNGOPage() {
  const params = useParams();
  const ngoId = params["ngo-id"];
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);

  const ngoData = {
    logo: "/placeholder.svg?height=600&width=600",
    name: "Example NGO",
    ownerName: "John Doe",
    registrationNumber: "REG123456",
    description:
      "We are dedicated to making a positive impact in our community.",
    mission: "To empower individuals and create sustainable change.",
    vision: "A world where everyone has equal opportunities to thrive.",
    website: "https://www.examplengo.org",
    email: "contact@examplengo.org",
    address: "123 Main St, City",
    state: "State",
    district: "District",
    socialMedia: {
      facebook: "https://facebook.com/examplengo",
      instagram: "https://instagram.com/examplengo",
      twitter: "https://twitter.com/examplengo",
      linkedin: "https://linkedin.com/company/examplengo",
    },
  };

  // Modal states
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [showEthModal, setShowEthModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [ethAmount, setEthAmount] = useState("");
  const [rupeeEquivalent, setRupeeEquivalent] = useState(0);
  const [ethPrice, setEthPrice] = useState(0);
  const [activeTab, setActiveTab] = useState("Details");

  const tabs = ["Details", "Activities"];

  useEffect(() => {
    async function fetchNGO() {
      if (!ngoId) return;
      try {
        const docRef = doc(db, "ngo", ngoId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNgo(docSnap.data());
          console.log("NGODATA", docSnap.data());
        } else {
          setNgo(null);
        }
      } catch (error) {
        console.error("Error fetching NGO:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNGO();
  }, [ngoId]);

  useEffect(() => {
    async function fetchEthPrice() {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEthPrice(data.ethereum.inr);
      } catch (error) {
        console.error("Error fetching ETH price:", error);
        setEthPrice(0);
      }
    }

    fetchEthPrice();
    const intervalId = setInterval(fetchEthPrice, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (ethAmount && ethPrice > 0) {
      setRupeeEquivalent(parseFloat(ethAmount) * ethPrice);
    } else {
      setRupeeEquivalent(0);
    }
  }, [ethAmount, ethPrice]);

  const handleDonate = (type) => {
    if (type === "money") {
      setShowMoneyModal(true);
    } else if (type === "ethereum") {
      setShowEthModal(true);
    } else {
      console.log(`Donating ${type} to NGO ${ngoId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h2 className="text-2xl font-semibold">NGO not found</h2>
      </div>
    );
  }

  const handleMoneyDonation = async () => {
    // Implement payment gateway integration here
    console.log(`Processing donation of ₹${donationAmount}`);
    setDonationAmount("");
    setShowMoneyModal(false);
  };

  const handleEthDonation = async () => {
    // Implement Ethereum payment integration here
    console.log(
      `Processing donation of ${ethAmount} ETH (₹${rupeeEquivalent.toLocaleString("en-IN", { maximumFractionDigits: 2 })})`
    );
    setEthAmount("");
    setShowEthModal(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-8"
      >
        <Card className="bg-white shadow-lg">
          <div className="h-96">
            <img
              src={ngo.logoUrl || "/api/placeholder/1200/800"}
              alt={ngo.ngoName}
              className="h-full w-full object-contain"
            />
            {/* <div className="absolute bottom-4 right-4 space-x-2">
              <Button variant="secondary" size="sm" onClick={prevImage}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" onClick={nextImage}>
                Next
              </Button>
            </div> */}
          </div>
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">{ngo?.ngoName}</CardTitle>
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-[#1CAC78] hover:bg-[#158f64]">
                    <Wallet className="h-4 w-4 mr-2" />
                    Donate Now
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleDonate("money")}>
                    Donate Money
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDonate("resources")}>
                    Donate Resources
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDonate("ethereum")}>
                    Donate via Ethereum
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}
              <DonateNowButton ngoData={ngo} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="container mx-auto px-4 py-16">
              <div className="flex justify-center mb-8">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 mx-2 rounded-full transition-colors ${
                      activeTab === tab
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === "Details" && (
                    <NGODetails ngo={ngo} ngoId={ngoId} />
                  )}
                  {activeTab === "Activities" && <NGOActivities />}
                </motion.div>
              </AnimatePresence>
            </div>
            {/*  */}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showMoneyModal} onOpenChange={setShowMoneyModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Donate Money</DialogTitle>
            <DialogDescription>
              Enter the amount you would like to donate to {ngo?.ngoName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (in ₹)</Label>
              <Input
                id="amount"
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="Enter amount"
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowMoneyModal(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#1CAC78] hover:bg-[#158f64]"
              onClick={handleMoneyDonation}
              disabled={!donationAmount || parseFloat(donationAmount) <= 0}
            >
              Pay Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ethereum Donation Modal */}
      <Dialog open={showEthModal} onOpenChange={setShowEthModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Donate via Ethereum</DialogTitle>
            <DialogDescription>
              Enter the amount of ETH you would like to donate
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="eth-amount">Amount (in ETH)</Label>
              <Input
                id="eth-amount"
                type="number"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                placeholder="Enter ETH amount"
                className="col-span-3"
              />
            </div>
            {ethAmount && (
              <div className="text-sm text-gray-500">
                Equivalent amount: ₹
                {rupeeEquivalent.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowEthModal(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#1CAC78] hover:bg-[#158f64]"
              onClick={handleEthDonation}
              disabled={!ethAmount || parseFloat(ethAmount) <= 0}
            >
              Pay with ETH
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
