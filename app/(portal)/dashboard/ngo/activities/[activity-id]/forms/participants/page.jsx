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

const ParticipantsPage = () => {
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
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

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-semibold mb-4">Participants List</h2>
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
                  <AlertDialogTitle>
                    {selectedParticipant?.name}
                  </AlertDialogTitle>
                  <AlertDialogCancel className="text-black cursor-pointer absolute right-4 top-4">
                    <X className="h-4 w-4" />
                  </AlertDialogCancel>
                </AlertDialogHeader>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    <strong>Status:</strong> {selectedParticipant?.status}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedParticipant?.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedParticipant?.phone}
                  </p>
                  <p>
                    <strong>Attendance:</strong>{" "}
                    {selectedParticipant?.attendance ? "Attended" : "Pending"}
                  </p>
                  <p>
                    <strong>Submitted At:</strong>{" "}
                    {new Date(
                      selectedParticipant?.submittedAt
                    ).toLocaleString()}
                  </p>
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
