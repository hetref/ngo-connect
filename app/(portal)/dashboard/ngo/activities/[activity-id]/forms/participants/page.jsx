"use client";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  updateDoc,
} from "firebase/firestore";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

const ParticipantsPage = () => {
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    email: "",
    phone: "",
  });
  const { "activity-id": activityId } = useParams();

  useEffect(() => {
    if (!activityId) return;
    // Real-time listener for participants
    const unsubscribe = onSnapshot(
      collection(db, "activities", activityId, "participants"),
      (snapshot) => {
        const participantsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setParticipants(participantsList);
      }
    );
    return () => unsubscribe();
  }, [activityId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewParticipant((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addParticipant = async () => {
    if (!newParticipant.email) {
      toast.error("Email is required");
      return;
    }
    setLoading(true);
    try {
      // Find user by email
      let userId = null;
      let userName = "";
      let eventName = "";
      const usersSnapshot = await getDocs(
        query(
          collection(db, "users"),
          where("email", "==", newParticipant.email)
        )
      );

      if (!usersSnapshot.empty) {
        // User exists - get doc.id and user data
        const userDoc = usersSnapshot.docs[0];
        userId = userDoc.id;
        const userData = userDoc.data();
        userName = userData.name || "Unknown User";

        // Check if user is already a participant for this activity
        if (userData.participations && Array.isArray(userData.participations)) {
          const alreadyParticipating = userData.participations.some(
            (participation) => participation.activityId === activityId
          );

          if (alreadyParticipating) {
            toast.error("This user is already a participant for this event");
            setLoading(false);
            return;
          }
        }
      } else {
        // User not found
        toast.error(
          "User not found with this email. Please register the user first."
        );
        setLoading(false);
        return;
      }

      // Also check if user exists in the participants collection for this activity
      const participantDocRef = doc(
        db,
        "activities",
        activityId,
        "participants",
        userId
      );
      const participantDocSnap = await getDoc(participantDocRef);

      if (participantDocSnap.exists()) {
        toast.error("This user is already a participant for this event");
        setLoading(false);
        return;
      }

      // Current timestamp
      const now = new Date().toISOString();

      // Get NGO ID and name from activity
      const activityDocRef = doc(db, "activities", activityId);
      const activityDocSnap = await getDoc(activityDocRef);

      let ngoId = "";
      let ngoName = "";

      if (activityDocSnap.exists()) {
        const activityData = activityDocSnap.data();
        ngoId = activityData.ngoId || "";
        eventName = activityData.eventName || "Unknown Event";
        // Fetch NGO name if we have an ngoId
        if (ngoId) {
          const ngoDocRef = doc(db, "ngo", ngoId);
          const ngoDocSnap = await getDoc(ngoDocRef);
          if (ngoDocSnap.exists()) {
            ngoName = ngoDocSnap.data().ngoName || "Our Organization";
          }
        }
      }

      // Add to activities/{activityId}/participants/{userId}
      await setDoc(doc(db, "activities", activityId, "participants", userId), {
        attendance: false, // Since this is an on-site entry
        email: newParticipant.email,
        experience: "", // No experience field for participants
        name: userName, // Using the name fetched from users collection
        phone: newParticipant.phone || "",
        status: "pending",
        submittedAt: now,
        userId: userId,
      });

      // Update user's participations array
      await updateDoc(doc(db, "users", userId), {
        participations: arrayUnion({
          activityId,
          appliedAt: now,
          attendance: false,
          ngoId,
          sId: "abc", // Using a placeholder sId as per the example
          status: "pending",
        }),
      });

      // Increment the noOfParticipants count in the activity document
      await updateDoc(doc(db, "activities", activityId), {
        noOfParticipants: (activityDocSnap.data().noOfParticipants || 0) + 1,
      });

      // Only send SMS if phone number is provided
      if (newParticipant.phone) {
        const smsBody = `Hello ${userName}, you have been added as a participant for ${eventName} at ${ngoName}.`;

        fetch("/api/send-sms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: newParticipant.phone,
            body: smsBody,
          }),
        }).then((res) => {
          if (res.ok) {
            console.log("SMS sent successfully!");
          } else {
            console.error("Error sending SMS:", res.status);
          }
        });
      }

      // Send email invitation
      fetch("/api/on-site-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "Participant",
          ngoId: ngoId,
          email: newParticipant.email,
          ngoName: ngoName,
          eventName: eventName,
        }),
      }).then((res) => {
        if (res.ok) {
          console.log("Email sent successfully!");
        } else {
          console.error("Error sending email:", res.status);
        }
      });

      // Reset form
      setNewParticipant({
        email: "",
        phone: "",
      });

      toast.success("Participant added successfully");
    } catch (error) {
      console.error("Error adding participant:", error);
      toast.error("Failed to add participant: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold mb-4">Participants List</h2>
        <AlertDialog>
          <AlertDialogTrigger className="bg-green-500 hover:bg-green-600 p-2 rounded-lg text-white">
            Add on-site entries
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add Participant</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newParticipant.email}
                    onChange={handleInputChange}
                    placeholder="Enter participant's email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="text"
                    value={newParticipant.phone}
                    onChange={handleInputChange}
                    placeholder="Enter participant's phone number"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={addParticipant} disabled={loading}>
                {loading ? "Adding..." : "Add Participant"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {participants.length > 0 ? (
        <ul className="space-y-3">
          {participants.map((participant) => (
            <AlertDialog key={participant.id}>
              <AlertDialogTrigger asChild>
                <li
                  onClick={() => setSelectedParticipant(participant)}
                  className="p-4 border rounded-lg shadow-sm bg-white flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
                >
                  <span className="font-medium">{participant.name}</span>
                  <span className="bg-green-400 text-white rounded-full px-2 py-1 font-medium">
                    {participant.attendance === false ? "Pending" : "Attended"}
                  </span>
                </li>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader className="flex justify-between items-center">
                  <AlertDialogTitle>{participant.name}</AlertDialogTitle>
                  <AlertDialogCancel className="text-black cursor-pointer absolute right-4 top-4">
                    <X className="h-4 w-4" />
                  </AlertDialogCancel>
                </AlertDialogHeader>
                <AlertDialogDescription className="space-y-2">
                  <div className="space-y-2">
                    <div>
                      <strong>Status:</strong> {participant.status}
                    </div>
                    <div>
                      <strong>Email:</strong> {participant.email}
                    </div>
                    <div>
                      <strong>Phone:</strong> {participant.phone}
                    </div>
                    <div>
                      <strong>Attendance:</strong>{" "}
                      {participant.attendance ? "Attended" : "Pending"}
                    </div>
                    <div>
                      <strong>Submitted At:</strong>{" "}
                      {new Date(participant.submittedAt).toLocaleString()}
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogContent>
            </AlertDialog>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No participants found.</p>
      )}
    </div>
  );
};

export default ParticipantsPage;
