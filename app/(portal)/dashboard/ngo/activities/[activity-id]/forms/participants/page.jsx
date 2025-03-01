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
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const ParticipantsPage = () => {
  const [participants, setParticipants] = useState([]);
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

  // Function to download data as CSV
  const downloadCSV = () => {
    if (participants.length === 0) {
      toast.error("No data to download");
      return;
    }

    // Define CSV headers
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Status",
      "Attendance",
      "Submitted At",
    ];

    // Convert participants data to CSV format
    const csvData = participants.map((participant) => {
      return [
        participant.name || "",
        participant.email || "",
        participant.phone || "",
        participant.status || "",
        participant.attendance ? "Attended" : "Pending",
        participant.submittedAt
          ? new Date(participant.submittedAt).toLocaleString()
          : "",
      ].join(",");
    });

    // Combine headers and data
    const csv = [headers.join(","), ...csvData].join("\n");

    // Create a Blob and download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `participants_${activityId}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // const loadingToast = toast.loading("Downloading CSV file...");
    toast.success("CSV file downloaded successfully");
  };

  return (
    <div className="mx-auto mt-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold mb-4">Participants List</h2>
        <div className="flex space-x-2 items-center">
          <Button
            onClick={downloadCSV}
            className="bg-black px-2 py-4 rounded-lg text-white flex items-center "
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
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
      </div>

      {participants.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left border-b">Name</th>
                <th className="py-3 px-4 text-left border-b">Email</th>
                <th className="py-3 px-4 text-left border-b">Phone</th>
                <th className="py-3 px-4 text-left border-b">Attendance</th>
                <th className="py-3 px-4 text-left border-b">Form Filled At</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant) => (
                <tr key={participant.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{participant.name}</td>
                  <td className="py-3 px-4 border-b">{participant.email}</td>
                  <td className="py-3 px-4 border-b">{participant.phone}</td>
                  <td className="py-3 px-4 border-b">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${participant.attendance ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                    >
                      {participant.attendance ? "Attended" : "Pending"}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-b">
                    {participant.submittedAt
                      ? new Date(participant.submittedAt).toLocaleString()
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No participants found.</p>
      )}
    </div>
  );
};

export default ParticipantsPage;
