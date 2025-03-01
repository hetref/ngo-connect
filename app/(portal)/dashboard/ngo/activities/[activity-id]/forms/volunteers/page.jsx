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

const VolunteersPage = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newVolunteer, setNewVolunteer] = useState({
    email: "",
    phone: "",
  });
  const { "activity-id": activityId } = useParams();

  useEffect(() => {
    if (!activityId) return;
    // Real-time listener for volunteers
    const unsubscribe = onSnapshot(
      collection(db, "activities", activityId, "volunteers"),
      (snapshot) => {
        const volunteersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVolunteers(volunteersList);
      }
    );
    return () => unsubscribe();
  }, [activityId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVolunteer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addVolunteer = async () => {
    if (!newVolunteer.email) {
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
        query(collection(db, "users"), where("email", "==", newVolunteer.email))
      );

      if (!usersSnapshot.empty) {
        // User exists - get doc.id and user data
        const userDoc = usersSnapshot.docs[0];
        userId = userDoc.id;
        const userData = userDoc.data();
        userName = userData.name || "Unknown User";

        // Check if user is already a volunteer for this activity
        if (userData.volunteering && Array.isArray(userData.volunteering)) {
          const alreadyVolunteering = userData.volunteering.some(
            (volunteer) => volunteer.activityId === activityId
          );

          if (alreadyVolunteering) {
            toast.error("This user is already a volunteer for this event");
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

      // Also check if user exists in the volunteers collection for this activity
      const volunteerDocRef = doc(
        db,
        "activities",
        activityId,
        "volunteers",
        userId
      );
      const volunteerDocSnap = await getDoc(volunteerDocRef);

      if (volunteerDocSnap.exists()) {
        toast.error("This user is already a volunteer for this event");
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

      // Add to activities/{activityId}/volunteers/{userId}
      await setDoc(doc(db, "activities", activityId, "volunteers", userId), {
        attendance: true, // Since this is an on-site entry
        email: newVolunteer.email,
        experience: "On-site entry",
        name: userName, // Using the name fetched from users collection
        phone: newVolunteer.phone || "",
        status: "Approved",
        submittedAt: now,
      });

      // Update user's volunteering array
      await updateDoc(doc(db, "users", userId), {
        volunteering: arrayUnion({
          activityId,
          appliedAt: now,
          attendance: true,
          ngoId,
          sId: activityId, // Using activityId as sId
          status: "Approved",
        }),
      });

      // Increment the noOfVolunteers count in the activity document
      await updateDoc(doc(db, "activities", activityId), {
        noOfVolunteers: (activityDocSnap.data().noOfVolunteers || 0) + 1,
      });

      // Only send SMS if phone number is provided
      if (newVolunteer.phone) {
        const smsBody = `Hello ${userName}, you have been added as a volunteer for ${eventName} at ${ngoName}.`;

        fetch("/api/send-sms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: newVolunteer.phone,
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
          type: "Volunteer",
          ngoId: ngoId,
          email: newVolunteer.email,
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
      setNewVolunteer({
        email: "",
        phone: "",
      });

      toast.success("Volunteer added successfully");
    } catch (error) {
      console.error("Error adding volunteer:", error);
      toast.error("Failed to add volunteer: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold mb-4">Volunteers List</h2>
        <AlertDialog>
          <AlertDialogTrigger className="bg-green-500 hover:bg-green-600 p-2 rounded-lg text-white">
            Add on-site entries
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add Volunteer</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newVolunteer.email}
                    onChange={handleInputChange}
                    placeholder="Enter volunteer's email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="text"
                    value={newVolunteer.phone}
                    onChange={handleInputChange}
                    placeholder="Enter volunteer's phone number"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={addVolunteer} disabled={loading}>
                {loading ? "Adding..." : "Add Volunteer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {volunteers.length > 0 ? (
        <ul className="space-y-3">
          {volunteers.map((volunteer) => (
            <AlertDialog key={volunteer.id}>
              <AlertDialogTrigger asChild>
                <li
                  onClick={() => setSelectedVolunteer(volunteer)}
                  className="p-4 border rounded-lg shadow-sm bg-white flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
                >
                  <span className="font-medium">{volunteer.name}</span>
                  <span className="bg-green-400 text-white rounded-full px-2 py-1 font-medium">
                    {volunteer.attendance === false ? "Pending" : "Attended"}
                  </span>
                </li>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader className="flex justify-between items-center">
                  <AlertDialogTitle>{volunteer.name}</AlertDialogTitle>
                  <AlertDialogCancel className="text-black cursor-pointer absolute right-4 top-4">
                    <X className="h-4 w-4" />
                  </AlertDialogCancel>
                </AlertDialogHeader>
                <AlertDialogDescription className="space-y-2">
                  <div className="space-y-2">
                    <div>
                      <strong>Status:</strong> {volunteer.status}
                    </div>
                    <div>
                      <strong>Email:</strong> {volunteer.email}
                    </div>
                    <div>
                      <strong>Phone:</strong> {volunteer.phone}
                    </div>
                    <div>
                      <strong>Experience:</strong> {volunteer.experience}
                    </div>
                    <div>
                      <strong>Attendance:</strong>{" "}
                      {volunteer.attendance ? "Attended" : "Pending"}
                    </div>
                    <div>
                      <strong>Submitted At:</strong>{" "}
                      {new Date(volunteer.submittedAt).toLocaleString()}
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogContent>
            </AlertDialog>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No volunteers found.</p>
      )}
    </div>
  );
};

export default VolunteersPage;
