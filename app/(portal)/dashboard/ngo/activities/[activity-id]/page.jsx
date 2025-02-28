"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  Bookmark,
  ArrowBigDown,
  MoveUpRight,
} from "lucide-react";
import { PayoutManagement } from "@/components/payout-management";
import Image from "next/image";

import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth } from "@/lib/firebase";
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
import Link from "next/link";

const events = [
  {
    id: 1,
    title: "Beach Cleanup",
    date: "2023-08-15",
    location: "Sunny Beach",
    volunteers: 45,
    description:
      "Join us for a day of cleaning up our beautiful beaches and protecting marine life.",
    images: [
      "https://source.unsplash.com/random/800x600/?beach,cleanup",
      "https://source.unsplash.com/random/800x600/?ocean,plastic",
      "https://source.unsplash.com/random/800x600/?volunteer,beach",
    ],
  },
  {
    id: 2,
    title: "Food Drive",
    date: "2023-08-20",
    location: "Community Center",
    volunteers: 30,
    description:
      "Help us collect and distribute food to those in need in our community.",
    images: [
      "https://source.unsplash.com/random/800x600/?food,donation",
      "https://source.unsplash.com/random/800x600/?volunteer,foodbank",
      "https://source.unsplash.com/random/800x600/?community,help",
    ],
  },
  {
    id: 3,
    title: "Tree Planting",
    date: "2023-08-10",
    location: "City Park",
    volunteers: 60,
    description:
      "Let's make our city greener by planting trees in the local park.",
    images: [
      "https://source.unsplash.com/random/800x600/?tree,planting",
      "https://source.unsplash.com/random/800x600/?forest,sapling",
      "https://source.unsplash.com/random/800x600/?nature,conservation",
    ],
  },
];

export default function NGOActivitiesPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = params["activity-id"];
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedActivity, setEditedActivity] = useState(null);
  const user = auth.currentUser;
  const db = getFirestore();

  useEffect(() => {
    if (!activityId) return;

    const activityRef = doc(db, "activities", activityId);
    const unsubscribe = onSnapshot(
      activityRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const activityData = {
            id: snapshot.id,
            ...snapshot.data(),
          };
          setActivity(activityData);
          setEditedActivity(activityData);
        } else {
          setActivity(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching activity:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activityId, db]);

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const activityRef = doc(db, "activities", activityId);
      await updateDoc(activityRef, {
        eventName: editedActivity.eventName,
        tagline: editedActivity.tagline,
        shortDescription: editedActivity.shortDescription,
        additionalNotes: editedActivity.additionalNotes,
        location: editedActivity.location,
        eventDate: editedActivity.eventDate,
        participationDeadline: editedActivity.participationDeadline,
        coordinator: editedActivity.coordinator,
        contactEmail: editedActivity.contactEmail,
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating activity:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDoc(doc(db, "activities", activityId));
      setIsDeleteDialogOpen(false);
      router.push("/dashboard/ngo/activities"); // Redirect to activities list
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };

  const handleBookmark = () => {
    console.log("Bookmark activity:", activity.id);
  };

  if (!activity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h2 className="text-2xl font-semibold">Event not found</h2>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto"
      >
        <Card className="overflow-hidden relative">
          <div className="absolute top-4 right-4 z-10 flex space-x-2">
            {user?.uid === activity.ngoId && (
              <>
                <Button
                  className="bg-[#1CAC78] hover:bg-[#158f63]"
                  onClick={handleEdit}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Event
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                </Button>
              </>
            )}
            <Link
              href={`/dashboard/ngo/activities/${activity.id}/forms`}
              className="bg-white flex items-center rounded-lg p-2 shadow-md"
            >
              <MoveUpRight className="mr-2 h-4 w-4" /> Manage Forms
            </Link>
          </div>

          <div className="relative h-96">
            <Image
              src={activity.featuredImageUrl || "/placeholder.svg"}
              alt={activity.eventName}
              layout="fill"
              objectFit="contain"
              className="absolute inset-0"
            />
          </div>
          <CardHeader>
            <CardTitle className="text-3xl">{activity.eventName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center space-x-4 text-gray-500">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>{activity.eventDate}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>{activity.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>{activity.contactEmail}</span>
              </div>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="mb-2">
                <strong>Tagline:</strong> {activity.tagline}
              </p>
              <p className="mb-2">
                <strong>Description:</strong> {activity.shortDescription}
              </p>
              <p className="mb-2">
                <strong>Additional Notes:</strong> {activity.additionalNotes}
              </p>
              <p className="mb-2">
                <strong>Contact Email:</strong> {activity.contactEmail}
              </p>
              <p className="mb-2">
                <strong>Participation Deadline:</strong>{" "}
                {activity.participationDeadline}
              </p>
            </div>
          </CardContent>
        </Card>
        <PayoutManagement />
      </motion.div>

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
              <Label htmlFor="coordinator">Coordinator</Label>
              <Input
                id="coordinator"
                value={editedActivity?.coordinator || ""}
                onChange={(e) =>
                  setEditedActivity({
                    ...editedActivity,
                    coordinator: e.target.value,
                  })
                }
                disabled
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
              onClick={() => setIsEditDialogOpen(false)}
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
