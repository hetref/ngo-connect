"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { MoveUpRight, Pencil, Trash } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const ActivityFormsPage = () => {
  const { "activity-id": activityId } = useParams();
  const router = useRouter();
  const [ngoId, setNgoId] = useState("");
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showParticipantDialog, setShowParticipantDialog] = useState(false);
  const [participantLimit, setParticipantLimit] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [emailInvitations, setEmailInvitations] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);

  useEffect(() => {
    const fetchNgoId = async () => {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        setNgoId(userDoc.data().ngoId);
      }
    };
    fetchNgoId();
  }, []);

  useEffect(() => {
    if (!ngoId) return;
    const activityDocRef = doc(db, "activities", activityId);
    const unsubscribe = onSnapshot(
      activityDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setActivityData({
            ...data,
            participationFormStatus:
              data.participationFormStatus || "not-accepting",
            noOfParticipants: data.noOfParticipants || 0,
            acceptingParticipants: data.acceptingParticipants || 0,
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error setting up real-time listener:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [ngoId, activityId]);

  const handleToggle = async (formType) => {
    const statusField = "participationFormStatus";
    const newStatus =
      activityData[statusField] === "accepting" ? "not-accepting" : "accepting";

    if (newStatus === "accepting" && !activityData["acceptingParticipants"]) {
      setShowParticipantDialog(true);
    } else {
      await updateActivityDoc({ [statusField]: newStatus });
    }
  };

  const handleAddEmail = () => {
    if (newEmail && !emailInvitations.includes(newEmail)) {
      setEmailInvitations([...emailInvitations, newEmail]);
      setNewEmail("");
    } else {
      alert("Please enter a valid email or it is already added.");
    }
  };

  const handleSendInvitations = async () => {
    const onSpotEntries = emailInvitations.map((email) => ({
      verificationCode: Math.floor(1000 + Math.random() * 9000).toString(),
      email: email,
      status: "pending",
    }));

    await updateActivityDoc({
      onSpotEntries: onSpotEntries,
    });

    alert("Invitations sent successfully!");
  };

  const handleLimitSubmit = async () => {
    const limit = participantLimit;

    if (!limit || isNaN(limit) || parseInt(limit) <= 0) {
      alert("Please enter a valid number");
      return;
    }

    const updates = {
      participationFormStatus: "accepting",
      acceptingParticipants: parseInt(limit),
      noOfParticipants: activityData?.["noOfParticipants"] || 0,
    };

    await updateActivityDoc(updates);
    setShowParticipantDialog(false);
    setParticipantLimit("");
  };

  const updateActivityDoc = async (updates) => {
    try {
      const activityDocRef = doc(db, "activities", activityId);
      await updateDoc(activityDocRef, updates);
    } catch (error) {
      console.error("Error updating document:", error);
      alert("Error updating activity: " + error.message);
    }
  };

  const handleEditLimit = () => {
    setIsEditing(true);
    const limit = activityData.acceptingParticipants;
    setParticipantLimit(limit.toString());
    setShowParticipantDialog(true);
  };

  const FormCard = ({ title, status }) => {
    const currentCount = activityData?.["noOfParticipants"] || 0;
    const limit = activityData?.["acceptingParticipants"];
    const isAtLimit = limit && currentCount >= limit;
    const isAccepting = status === "accepting";

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            {title}
            <div className="flex items-center space-x-2">
              {(isAccepting || currentCount > 0) && (
                <Pencil
                  className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={() => handleEditLimit()}
                />
              )}
              <Switch
                checked={isAccepting}
                onCheckedChange={() => handleToggle("participation")}
                disabled={isAtLimit}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <div className="space-y-2">
            <p>
              Status:{" "}
              <span className="capitalize font-medium">
                {status || "not-accepting"}
              </span>
            </p>
            {(isAccepting || currentCount > 0) && (
              <p>
                Participants: {currentCount} / {limit}
              </p>
            )}
          </div>
          <div>
            <Link
              className="bg-[#1CAC78] hover:bg-green-500 text-white p-2 rounded-lg flex items-center"
              href={`/dashboard/ngo/activities/${activityId}/forms/participants`}
            >
              <MoveUpRight className="mr-2 h-4 w-4" />
              View Participants
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">
        Activity Registeration Forms Dashboard
      </h1>
      <div className="grid grid-cols-1 gap-4  mb-8">
        <FormCard
          title="Participation Form"
          status={activityData?.participationFormStatus}
        />
      </div>

      <AlertDialog
        open={showParticipantDialog}
        onOpenChange={setShowParticipantDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Participant Limit</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the maximum number of participants you want to accept for
              this activity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="participantLimit">
                Maximum number of participants
              </Label>
              <Input
                id="participantLimit"
                type="number"
                value={participantLimit}
                onChange={(e) => setParticipantLimit(e.target.value)}
                min="1"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleLimitSubmit()}>
              {isEditing ? "Update" : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActivityFormsPage;
