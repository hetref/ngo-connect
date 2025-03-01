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
  const [showVolunteerDialog, setShowVolunteerDialog] = useState(false);
  const [showParticipantDialog, setShowParticipantDialog] = useState(false);
  const [volunteerLimit, setVolunteerLimit] = useState("");
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
            volunteerFormStatus: data.volunteerFormStatus || "not-accepting",
            participationFormStatus:
              data.participationFormStatus || "not-accepting",
            noOfVolunteers: data.noOfVolunteers || 0,
            noOfParticipants: data.noOfParticipants || 0,
            acceptingVolunteers: data.acceptingVolunteers || 0,
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
    const isVolunteerForm = formType === "volunteer";
    const statusField = isVolunteerForm
      ? "volunteerFormStatus"
      : "participationFormStatus";
    const newStatus =
      activityData[statusField] === "accepting" ? "not-accepting" : "accepting";

    if (
      newStatus === "accepting" &&
      !activityData[
        isVolunteerForm ? "acceptingVolunteers" : "acceptingParticipants"
      ]
    ) {
      isVolunteerForm
        ? setShowVolunteerDialog(true)
        : setShowParticipantDialog(true);
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

  const handleLimitSubmit = async (formType) => {
    const isVolunteerForm = formType === "volunteer";
    const limit = isVolunteerForm ? volunteerLimit : participantLimit;

    if (!limit || isNaN(limit) || parseInt(limit) <= 0) {
      alert("Please enter a valid number");
      return;
    }

    const updates = {
      [isVolunteerForm ? "volunteerFormStatus" : "participationFormStatus"]:
        "accepting",
      [isVolunteerForm ? "acceptingVolunteers" : "acceptingParticipants"]:
        parseInt(limit),
      [isVolunteerForm ? "noOfVolunteers" : "noOfParticipants"]:
        activityData?.[
          isVolunteerForm ? "noOfVolunteers" : "noOfParticipants"
        ] || 0,
    };

    await updateActivityDoc(updates);
    isVolunteerForm
      ? setShowVolunteerDialog(false)
      : setShowParticipantDialog(false);
    isVolunteerForm ? setVolunteerLimit("") : setParticipantLimit("");
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

  const handleEditLimit = (formType) => {
    setIsEditing(true);
    const limit =
      formType === "volunteer"
        ? activityData.acceptingVolunteers
        : activityData.acceptingParticipants;
    formType === "volunteer"
      ? setVolunteerLimit(limit.toString())
      : setParticipantLimit(limit.toString());
    formType === "volunteer"
      ? setShowVolunteerDialog(true)
      : setShowParticipantDialog(true);
  };

  const FormCard = ({ title, formType, status }) => {
    const isVolunteerForm = formType === "volunteer";
    const currentCount =
      activityData?.[isVolunteerForm ? "noOfVolunteers" : "noOfParticipants"] ||
      0;
    const limit =
      activityData?.[
        isVolunteerForm ? "acceptingVolunteers" : "acceptingParticipants"
      ];
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
                  onClick={() => handleEditLimit(formType)}
                />
              )}
              <Switch
                checked={isAccepting}
                onCheckedChange={() => handleToggle(formType)}
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
                {isVolunteerForm ? "Volunteers" : "Participants"}:{" "}
                {currentCount} / {limit}
              </p>
            )}
          </div>
          <div>
            {isVolunteerForm ? (
              <Link
                href={`/dashboard/ngo/activities/${activityId}/forms/volunteers`}
                className="bg-[#1CAC78] hover:bg-green-500 text-white p-2 rounded-lg flex items-center"
              >
                <MoveUpRight className="mr-2 h-4 w-4" />
                View Volunteers
              </Link>
            ) : (
              <Link
                className="bg-[#1CAC78] hover:bg-green-500 text-white p-2 rounded-lg flex items-center"
                href={`/dashboard/ngo/activities/${activityId}/forms/participants`}
              >
                {" "}
                <MoveUpRight className="mr-2 h-4 w-4" />
                View Participants
              </Link>
            )}
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
      <h1 className="text-2xl font-bold mb-6">Activity Forms Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-8">
        <FormCard
          title="Volunteer Form"
          formType="volunteer"
          status={activityData?.volunteerFormStatus}
        />
        <FormCard
          title="Participation Form"
          formType="participation"
          status={activityData?.participationFormStatus}
        />
      </div>

      {/* <div className="space-y-4 mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Volunteer Registration Form Link:
          </h2>
          <Link
            href={`/opt-in-volunteer/${ngoId}/${activityId}`}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Open Form
          </Link>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            Participant Registration Form Link:
          </h2>
          <Link
            href={`/opt-in-participant/${ngoId}/${activityId}`}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Open Form
          </Link>
        </div>
      </div> */}

      <AlertDialog
        open={showVolunteerDialog}
        onOpenChange={setShowVolunteerDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Volunteer Limit</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the maximum number of volunteers you want to accept for this
              activity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="volunteerLimit">
                Maximum number of volunteers
              </Label>
              <Input
                id="volunteerLimit"
                type="number"
                value={volunteerLimit}
                onChange={(e) => setVolunteerLimit(e.target.value)}
                min="1"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleLimitSubmit("volunteer")}>
              {isEditing ? "Update" : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogAction
              onClick={() => handleLimitSubmit("participation")}
            >
              {isEditing ? "Update" : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActivityFormsPage;
