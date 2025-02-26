"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  Plus,
  Users,
  Globe,
  Search,
  Filter,
  Wallet,
  Phone,
} from "lucide-react";
import Image from "next/image";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const NGO_CATEGORIES = [
  "Environmental",
  "Healthcare",
  "Education",
  "Animal Welfare",
  "Humanitarian",
  "Arts & Culture",
  "All",
];

const NGOListPage = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "ngo"),
      (ngoSnapshot) => {
        const ngoList = [];

        ngoSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.isVerified === "verified") {
            ngoList.push({
              id: doc.id,
              ...data,
            });
          }
        });

        setNgos(ngoList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching NGOs:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredNGOs = ngos.filter((ngo) => {
    const matchesSearch = ngo.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || ngo.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDonate = (type, ngoId) => {
    console.log(`Donating ${type} to NGO ${ngoId}`);
  };

  if (loading) {
    return (
      <div className=" min-h-[calc(100vh-100px)] flex justify-center items-center font-semibold text-2xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-80 w-full">
        <Image
          src="/coverbg.jpg"
          alt="NGO Cover"
          layout="fill"
          objectFit="cover"
          className="brightness-50"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white">
          <h1 className="text-4xl font-bold mb-4">Find and Support NGOs</h1>
          <p className="text-xl">Make a difference in the world today</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-8"
      >
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search NGOs..."
              className="pl-10 w-full border-2 border-gray-200 focus:border-gray-300 focus:ring-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-[#1CAC78] hover:bg-[#158f64] text-white">
                <Filter className="h-5 w-5" />
                Filter by Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter NGOs by Category</DialogTitle>
                <DialogDescription>
                  Select a category to filter the NGO list
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2">
                {NGO_CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory === category ? "default" : "outline"
                    }
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowFilters(false);
                    }}
                    className={`w-full ${selectedCategory === category ? "bg-[#1CAC78] hover:bg-[#158f64]" : ""}`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNGOs.map((ngo) => (
            <motion.div
              key={ngo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02] bg-white">
                <div className="relative h-48">
                  <Image
                    src={ngo?.logoUrl || "/api/placeholder/400/300"}
                    alt={ngo.ngoName}
                    layout="fill"
                    objectFit="contain"
                    className="absolute inset-0"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <Link href={`/ngo/${ngo.id}`}>{ngo.ngoName}</Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Wallet className="h-4 w-4 mr-2" />
                          Donate
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => handleDonate("money", ngo.id)}
                        >
                          Donate Money
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDonate("resources", ngo.id)}
                        >
                          Donate Resources
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDonate("ethereum", ngo.id)}
                        >
                          Donate via Ethereum
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Globe className="h-4 w-4" />
                    <span>{ngo.email || " "}</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                    <Phone className="h-4 w-4" />
                    <span>{ngo.phone}</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>{ngo.location}</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{ngo.memberCount || 0} members</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default NGOListPage;
