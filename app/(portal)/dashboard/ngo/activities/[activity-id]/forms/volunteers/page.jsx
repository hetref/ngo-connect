"use client";

import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
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
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";

const VolunteersPage = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
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

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-semibold mb-4">Volunteers List</h2>
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
                  <span className=" bg-green-400 text-white rounded-full px-2 py-1 font-medium">
                    {volunteer.attendance === false ? "Pending" : "Attended"}
                  </span>
                </li>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader className="flex justify-between items-center">
                  <AlertDialogTitle>{selectedVolunteer?.name}</AlertDialogTitle>
                  <AlertDialogCancel className="text-black cursor-pointer absolute right-4 top-4">
                    <X className="h-4 w-4" />
                  </AlertDialogCancel>
                </AlertDialogHeader>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    <strong>Status:</strong> {selectedVolunteer?.status}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedVolunteer?.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedVolunteer?.phone}
                  </p>
                  <p>
                    <strong>Experience:</strong> {selectedVolunteer?.experience}
                  </p>
                  <p>
                    <strong>Attendance:</strong>{" "}
                    {selectedVolunteer?.attendance ? "Attended" : "Pending"}
                  </p>
                  <p>
                    <strong>Submitted At:</strong>{" "}
                    {new Date(selectedVolunteer?.submittedAt).toLocaleString()}
                  </p>
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
