"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Autosuggest from "react-autosuggest";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  Plus,
  Users,
  Filter,
  SortDesc,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  MoveUpRight,
  QrCode,
  Search,
} from "lucide-react";
import { MetricsOverview } from "@/components/ngo-dashboard/metrics-overview";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  getDocs,
  collectionGroup,
  query,
  where,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function NGOActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [coordinatedActivities, setCoordinatedActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState(null);
  const [editedActivity, setEditedActivity] = useState(null);
  const user = auth.currentUser;
  const router = useRouter();

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, upcoming, past
  const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all-activities");
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const getSuggestions = (value) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0
      ? []
      : activities.filter((activity) =>
          activity.eventName.toLowerCase().includes(inputValue)
        );
  };

  const onSuggestionsFetchRequested = ({ value }) => {
    setSuggestions(getSuggestions(value));
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const onSuggestionSelected = (event, { suggestion }) => {
    setSearchTerm(suggestion.eventName);
    setFilteredActivities([suggestion]);
  };

  const inputProps = {
    placeholder: "Search for an event",
    value: searchTerm,
    onChange: (event, { newValue }) => {
      setSearchTerm(newValue);
    },
    className: "flex-grow p-2 border rounded-md w-full",
  };

  // Fetch all activities and coordinated activities
  useEffect(() => {
    let unsubscribeActivities;
    let unsubscribeUser;

    const setupRealtimeActivities = async () => {
      try {
        if (!user?.uid) return;

        // Get user document to check role
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          console.error("User not found");
          return;
        }

        const userData = userDoc.data();
        const userRole = userData.role;
        let ngoId;

        if (userRole === "admin") {
          ngoId = user.uid;
        } else if (userRole === "member") {
          ngoId = userData.ngoId;
          if (!ngoId) {
            console.error("NGO ID not found for member");
            return;
          }
        } else {
          console.error("Invalid user role");
          return;
        }

        // Fetch categories from ngo collection
        const ngoDocRef = doc(db, "ngo", ngoId);
        const ngoSnapshot = await getDoc(ngoDocRef);
        if (ngoSnapshot.exists() && ngoSnapshot.data().categories) {
          setCategories(ngoSnapshot.data().categories);
        }

        // Get coordinated activities
        const userRef = doc(db, "users", user.uid);
        unsubscribeUser = onSnapshot(userRef, async (userSnap) => {
          if (userSnap.exists() && userSnap.data().coordinatedEvents) {
            const coordEvents = userSnap.data().coordinatedEvents;

            // Fetch each coordinated activity details
            const coordActivitiesData = [];
            for (const id of coordEvents) {
              const activityRef = doc(db, "activities", id);
              const activitySnap = await getDoc(activityRef);

              if (activitySnap.exists()) {
                coordActivitiesData.push({
                  id: activitySnap.id,
                  ...activitySnap.data(),
                });
              }
            }

            setCoordinatedActivities(coordActivitiesData);
          } else {
            setCoordinatedActivities([]);
          }
        });

        // Get NGO document to watch activities array
        const ngoUserDoc = doc(db, "users", ngoId);
        const unsubscribeNGO = onSnapshot(ngoUserDoc, async (ngoSnapshot) => {
          if (!ngoSnapshot.exists()) {
            console.error("NGO document not found");
            return;
          }

          const activitiesArray = ngoSnapshot.data().activities || [];

          // Set total events count
          setTotalEvents(activitiesArray.length);

          // Set up listeners for each activity
          const unsubPromises = activitiesArray.map((activityId) => {
            return new Promise((resolve) => {
              const activityDoc = doc(db, "activities", activityId);
              const unsubActivity = onSnapshot(
                activityDoc,
                (activitySnapshot) => {
                  if (activitySnapshot.exists()) {
                    setActivities((prev) => {
                      const newActivities = prev.filter(
                        (a) => a.id !== activityId
                      );
                      return [
                        ...newActivities,
                        {
                          id: activityId,
                          ...activitySnapshot.data(),
                        },
                      ];
                    });
                  }
                }
              );
              resolve(unsubActivity);
            });
          });

          // Store all unsubscribe functions
          const unsubFunctions = await Promise.all(unsubPromises);
          unsubscribeActivities = () => {
            unsubFunctions.forEach((unsub) => unsub());
            unsubscribeNGO();
          };
        });

        setLoading(false);
      } catch (error) {
        console.error("Error setting up realtime activities:", error);
        setLoading(false);
      }
    };

    setupRealtimeActivities();

    return () => {
      if (unsubscribeActivities) {
        unsubscribeActivities();
      }
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, [user?.uid]);

  // Apply filters whenever the filter states or activities change
  useEffect(() => {
    if (!activities.length) {
      setFilteredActivities([]);
      return;
    }

    let result = [...activities];
    const today = new Date();

    // Apply category filter
    if (selectedCategory !== "all") {
      result = result.filter(
        (activity) => activity.category === selectedCategory
      );
    }

    // Apply date filter
    if (dateFilter === "upcoming") {
      result = result.filter((activity) => {
        const eventDate = new Date(activity.eventDate);
        return eventDate >= today;
      });
    } else if (dateFilter === "past") {
      result = result.filter((activity) => {
        const eventDate = new Date(activity.eventDate);
        return eventDate < today;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.eventDate);
      const dateB = new Date(b.eventDate);

      if (sortOrder === "newest") {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    setFilteredActivities(result);
  }, [activities, selectedCategory, dateFilter, sortOrder]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setSelectedCategory("all");
    setDateFilter("all");
    setSortOrder("newest");
  };

  const handleDeleteConfirm = async () => {
    try {
      if (activityToDelete) {
        await deleteDoc(doc(db, "activities", activityToDelete));
        setIsDeleteDialogOpen(false);
        setActivityToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };

  const handleScanNow = (activityId) => {
    router.push(`/dashboard/scan/participants/${activityId}`);
  };

  const handleEdit = (activity) => {
    setActivityToEdit(activity);
    setEditedActivity({ ...activity });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      if (editedActivity && activityToEdit) {
        const activityRef = doc(db, "activities", activityToEdit.id);
        await updateDoc(activityRef, {
          eventName: editedActivity.eventName,
          tagline: editedActivity.tagline || activityToEdit.tagline,
          shortDescription:
            editedActivity.shortDescription || activityToEdit.shortDescription,
          additionalNotes:
            editedActivity.additionalNotes || activityToEdit.additionalNotes,
          location: editedActivity.location,
          eventDate: editedActivity.eventDate,
          participationDeadline:
            editedActivity.participationDeadline ||
            activityToEdit.participationDeadline,
          contactEmail: editedActivity.contactEmail,
        });
        setIsEditDialogOpen(false);
        setActivityToEdit(null);
        setEditedActivity(null);
      }
    } catch (error) {
      console.error("Error updating activity:", error);
    }
  };

  const handleManageForms = (activityId) => {
    router.push(`/dashboard/ngo/activities/${activityId}/forms`);
  };

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Activity Management</h1>
        <div className="flex gap-2">
          {
            // Only show when the active tab is "all-activities"
            activeTab === "all-activities" && (
              <button
                onClick={toggleFilters}
                className="flex items-center px-4 py-2 text-sm font-medium bg-gray-100 rounded-md shadow-sm hover:bg-gray-200"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            )
          }
          <Link
            href="/dashboard/ngo/activities/new"
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#1CAC78] rounded-md shadow-sm hover:bg-[#18a06e]"
          >
            Create Activity <Plus className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 p-4 rounded-lg mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">All Events</option>
                  <option value="upcoming">Upcoming Events</option>
                  <option value="past">Past Events</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MetricsOverview type="Activity" />

      <Tabs
        defaultValue="all-activities"
        className="mt-8"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-4 grid grid-cols-2 w-full">
          <TabsTrigger
            value="all-activities"
            className={`border px-8 py-3 ${activeTab === "all-activities" ? "bg-green-500 text-white" : ""}`}
          >
            All Activities
          </TabsTrigger>
          <TabsTrigger
            value="coordinated-activities"
            className={`border px-8 py-3 ${activeTab === "coordinated-activities" ? "bg-green-500 text-white" : ""}`}
          >
            Activities assigned with{" "}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all-activities">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {filteredActivities.length}{" "}
              {filteredActivities.length === 1 ? "Activity" : "Activities"}{" "}
              {selectedCategory !== "all" ? `in ${selectedCategory}` : ""}
            </h2>

            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span>
                {dateFilter === "upcoming"
                  ? "Upcoming Events"
                  : dateFilter === "past"
                    ? "Past Events"
                    : "All Events"}
              </span>
              <SortDesc className="h-4 w-4 mx-1" />
              <span>
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
              </span>
            </div>
          </div>
          <div className="relative mb-4">
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={onSuggestionsFetchRequested}
              onSuggestionsClearRequested={onSuggestionsClearRequested}
              onSuggestionSelected={onSuggestionSelected}
              getSuggestionValue={(suggestion) => suggestion.eventName}
              renderSuggestion={(suggestion) => (
                <div>{suggestion.eventName}</div>
              )}
              inputProps={{
                ...inputProps,
                className: inputProps.className + " pl-10 ",
              }}
              theme={{
                container: "w-full",
                suggestionsContainer:
                  "absolute z-10 w-full bg-white shadow-lg rounded-md mt-1",
                suggestionsList: "list-none p-0 m-0",
              }}
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          </div>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                No activities found matching your filters.
              </p>
              {activities.length > 0 && (
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 text-sm font-medium text-[#1CAC78] bg-white border border-[#1CAC78] rounded-md hover:bg-[#f0f9f6]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <Link href={`/dashboard/ngo/activities/${activity.id}`}>
                    <Card className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg h-full">
                      <div className="relative h-48">
                        <Image
                          src={activity.featuredImageUrl || "/placeholder.svg"}
                          alt={activity.eventName}
                          layout="fill"
                          objectFit="contain"
                          className="absolute inset-0"
                        />
                      </div>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>{activity.eventName}</CardTitle>
                          {activity.category && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {activity.category}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(activity.eventDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span>{activity.location}</span>
                        </div>
                        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                          <Users className="h-4 w-4" />
                          <span>{activity.contactEmail}</span>
                        </div>
                        {new Date(activity.eventDate) < new Date() && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Past Event
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>

                  {/* 3-Dot Menu with Animation */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <motion.button
                          className="p-2 bg-green-400 rounded-full shadow-md border focus:outline-none animate-pulse "
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.5,
                          }}
                          whileHover={{
                            scale: 1.1,
                            backgroundColor: "#f0f9f6",
                          }}
                        >
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                        </motion.button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleEdit(activity)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Event
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-red-600"
                          onClick={() => {
                            setActivityToDelete(activity.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Event
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleManageForms(activity.id)}
                        >
                          <MoveUpRight className="mr-2 h-4 w-4" />
                          Manage Registeration Forms
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="coordinated-activities">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              {coordinatedActivities.length}{" "}
              {coordinatedActivities.length === 1
                ? "Coordinated Activity"
                : "Coordinated Activities"}
            </h2>
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={onSuggestionsFetchRequested}
              onSuggestionsClearRequested={onSuggestionsClearRequested}
              onSuggestionSelected={onSuggestionSelected}
              getSuggestionValue={(suggestion) => suggestion.eventName}
              renderSuggestion={(suggestion) => (
                <div>{suggestion.eventName}</div>
              )}
              inputProps={{
                ...inputProps,
                className: inputProps.className + " pl-10 mt-4",
              }}
              theme={{
                container: "w-full",
                suggestionsContainer:
                  "absolute z-10 w-full bg-white shadow-lg rounded-md mt-1",
                suggestionsList: "list-none p-0 m-0",
              }}
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          </div>

          {coordinatedActivities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4 font-bold text-2xl">
                You are not a co-ordinator of any activities yet!!!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {coordinatedActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="relative h-48 bg-gray-100">
                      <Image
                        src={activity.featuredImageUrl || "/placeholder.svg"}
                        alt={activity.eventName || "Activity"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">
                        {activity.eventName || "Unnamed Activity"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 flex-grow">
                      <div className="space-y-2">
                        {activity.eventDate && (
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>{activity.eventDate}</span>
                          </div>
                        )}
                        {activity.location && (
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span>{activity.location}</span>
                          </div>
                        )}
                        {activity.coordinator && (
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Users className="h-4 w-4 flex-shrink-0" />
                            <span>{activity.coordinator}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <div className="mt-auto p-4 pt-0 flex justify-between">
                      <Link href={`/dashboard/ngo/activities/${activity.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      <Button
                        onClick={() => handleScanNow(activity.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        Scan Now
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              activity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActivityToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                value={editedActivity?.eventName || ""}
                onChange={(e) =>
                  setEditedActivity({
                    ...editedActivity,
                    eventName: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={editedActivity?.tagline || ""}
                onChange={(e) =>
                  setEditedActivity({
                    ...editedActivity,
                    tagline: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedActivity?.shortDescription || ""}
                onChange={(e) =>
                  setEditedActivity({
                    ...editedActivity,
                    shortDescription: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editedActivity?.location || ""}
                onChange={(e) =>
                  setEditedActivity({
                    ...editedActivity,
                    location: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="eventDate">Event Date</Label>
              <Input
                id="eventDate"
                type="date"
                value={editedActivity?.eventDate || ""}
                onChange={(e) =>
                  setEditedActivity({
                    ...editedActivity,
                    eventDate: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deadline">Participation Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={editedActivity?.participationDeadline || ""}
                onChange={(e) =>
                  setEditedActivity({
                    ...editedActivity,
                    participationDeadline: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={editedActivity?.contactEmail || ""}
                onChange={(e) =>
                  setEditedActivity({
                    ...editedActivity,
                    contactEmail: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsEditDialogOpen(false);
                setActivityToEdit(null);
                setEditedActivity(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} className="bg-[#1CAC78]">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
