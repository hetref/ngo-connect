"use client";
import React, { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  collection,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase"; // Make sure you import your Firebase config
import { useParams } from "next/navigation";

const QRScannerPage = () => {
  const [scanning, setScanning] = useState(true);
  const [scannedResults, setScannedResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const params = useParams();
  const currentActivityId = params.activityId;

  // Custom notification function
  const showNotification = (title, message, type = "success") => {
    setNotification({ title, message, type });

    // Auto hide after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Get current user on component mount and load previous scans
  useEffect(() => {
    const loadPreviousScans = async () => {
      if (currentUser?.uid && currentActivityId) {
        try {
          const coordinatedEventRef = doc(
            db,
            "users",
            currentUser.uid,
            "coordinatedEvents",
            currentActivityId
          );

          const eventDoc = await getDoc(coordinatedEventRef);
          if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            const attendedParticipants = eventData.attendedParticipants || [];

            if (attendedParticipants.length > 0) {
              // For each attended participant, fetch their name and create a scan entry
              const previousScans = await Promise.all(
                attendedParticipants.map(async (participant) => {
                  const participantDoc = await getDoc(
                    doc(db, "users", participant.participationId)
                  );
                  const participantName = participantDoc.exists()
                    ? participantDoc.data().name || "Unknown"
                    : "Unknown";

                  return {
                    id: participant.scannedAt || Date.now(),
                    activityId: currentActivityId,
                    participationId: participant.participationId,
                    timestamp: new Date(
                      participant.scannedAt
                    ).toLocaleTimeString(),
                    success: true,
                    participantName,
                    data: JSON.stringify(
                      {
                        activityId: currentActivityId,
                        participationId: participant.participationId,
                        scannedAt: participant.scannedAt,
                      },
                      null,
                      2
                    ),
                  };
                })
              );

              setScannedResults(previousScans);
            }
          }
        } catch (error) {
          console.error("Error loading previous scans:", error);
        }
      }
    };

    loadPreviousScans();
  }, [currentUser, currentActivityId]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Function to remove scanner SVG lines
  useEffect(() => {
    const removeScannerLines = () => {
      // Target SVG elements specifically
      const scannerSvgs = document.querySelectorAll(
        '.scanner-container svg, div[style*="position: absolute"] svg'
      );
      scannerSvgs.forEach((svg) => {
        if (svg) {
          svg.style.display = "none";
          svg.remove();
        }
      });

      // Target path elements that might be creating the lines
      const scannerPaths = document.querySelectorAll(
        '.scanner-container path, div[style*="position: absolute"] path'
      );
      scannerPaths.forEach((path) => {
        if (path) {
          path.style.display = "none";
          path.remove();
        }
      });
    };

    // Run immediately
    removeScannerLines();

    // Set up an interval to continuously remove the SVG elements
    const interval = setInterval(removeScannerLines, 100);

    return () => clearInterval(interval);
  }, [scanning]);

  const updateDatabase = async (parsedData) => {
    try {
      setProcessing(true);
      const { activityId, participationId, ngoId, timestamp } = parsedData;

      if (!activityId || !participationId) {
        throw new Error("Missing required data in QR code");
      }

      // First check if this participant is already marked as attended in the database
      let alreadyAttended = false;

      // Check in the coordinator's records
      if (currentUser?.uid) {
        const coordinatedEventRef = doc(
          db,
          "users",
          currentUser.uid,
          "coordinatedEvents",
          activityId
        );

        const eventDoc = await getDoc(coordinatedEventRef);
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          // Check if this participant is already in attendedParticipants array
          alreadyAttended = eventData.attendedParticipants?.some(
            (participant) => participant.participationId === participationId
          );

          if (alreadyAttended) {
            return {
              success: true,
              participantName: "Already Checked In",
              alreadyAttended: true,
            };
          }

          // If not already attended, continue with attendance marking
          await updateDoc(coordinatedEventRef, {
            attendedParticipants: arrayUnion({
              participationId,
              scannedAt: new Date().toISOString(),
            }),
          });
        }
      }

      // Continue with updating the participant's record
      const participantRef = doc(db, "users", participationId);
      const participantDoc = await getDoc(participantRef);

      if (participantDoc.exists()) {
        // Check if attendance is already true in participant's record
        const participantsArray = participantDoc.data().participations || [];
        const currentAttendanceStatus = participantsArray.find(
          (p) => p.activityId === activityId
        )?.attendance;

        if (currentAttendanceStatus) {
          // Already marked as attended in the participant's record
          const participantName = participantDoc.data().name || "Participant";
          return {
            success: true,
            participantName,
            alreadyAttended: true,
          };
        }

        const updatedParticipantsArray = participantsArray.map(
          (participant) => {
            if (participant.activityId === activityId) {
              return { ...participant, attendance: true };
            }
            return participant;
          }
        );

        await updateDoc(participantRef, {
          participations: updatedParticipantsArray,
        });
      }

      // Update activities collection
      const activityParticipantRef = doc(
        db,
        "activities",
        activityId,
        "participants",
        participationId
      );

      // Check if already marked as attended in activity's participations subcollection
      const activityParticipantDoc = await getDoc(activityParticipantRef);
      if (
        activityParticipantDoc.exists() &&
        activityParticipantDoc.data().attendance
      ) {
        const participantName = participantDoc.exists()
          ? participantDoc.data().name || "Participant"
          : "Participant";

        return {
          success: true,
          participantName,
          alreadyAttended: true,
        };
      }

      await updateDoc(activityParticipantRef, {
        attendance: true,
      });

      // Get participant name for display
      const participantName = participantDoc.exists()
        ? participantDoc.data().name || "Participant"
        : "Participant";

      return {
        success: true,
        participantName,
      };
    } catch (error) {
      console.error("Error updating database:", error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setProcessing(false);
    }
  };

  const handleScan = async (result) => {
    if (result && !processing) {
      try {
        // Extract the text content from the result
        const rawValue =
          result.rawValue ||
          (typeof result === "string" ? result : JSON.stringify(result));

        // Parse the JSON data (handling the escaped JSON string)
        let parsedData;
        try {
          // First try parsing the raw value (might be a JSON string)
          parsedData = JSON.parse(rawValue);

          // If parsedData is still a string (double encoded), parse again
          if (typeof parsedData === "string") {
            parsedData = JSON.parse(parsedData);
          }

          // If it's an array (from the QR detection), extract the first item's rawValue
          if (Array.isArray(parsedData) && parsedData[0]?.rawValue) {
            const innerRawValue = parsedData[0].rawValue;
            parsedData = JSON.parse(innerRawValue);
          }
        } catch (e) {
          console.error("Error parsing QR data:", e);
          showNotification("Error", "Invalid QR code format", "error");
          return;
        }

        // Check if we already scanned this participant for this activity
        const isDuplicate = scannedResults.some(
          (scan) =>
            scan.participationId === parsedData.participationId &&
            scan.activityId === parsedData.activityId
        );

        if (isDuplicate) {
          showNotification(
            "Already Scanned",
            "This participant has already been checked in",
            "warning"
          );
          return;
        }

        if (currentActivityId !== parsedData.activityId) {
          showNotification(
            "Invalid Activity",
            "This QR code is not for the current activity",
            "error"
          );
          return;
        }

        // Update the database
        const updateResult = await updateDatabase(parsedData);

        if (updateResult.success) {
          if (updateResult.alreadyAttended) {
            showNotification(
              "Already Checked In",
              `${updateResult.participantName} was already marked present`,
              "warning"
            );
            // Don't add to scannedResults since it was already processed
          } else {
            // Add new scan to the beginning of the array (only for new check-ins)
            const newScan = {
              id: Date.now(),
              activityId: parsedData.activityId,
              participationId: parsedData.participationId,
              timestamp: new Date().toLocaleTimeString(),
              success: updateResult.success,
              participantName: updateResult.participantName || "Unknown",
              data: JSON.stringify(parsedData, null, 2),
            };

            setScannedResults((prev) => [newScan, ...prev]);

            showNotification(
              "Successfully Checked In",
              `${updateResult.participantName} has been marked present`,
              "success"
            );

            // Show success animation
            showSuccessAnimation(`${updateResult.participantName} checked in!`);

            // Temporarily pause scanner for better UX
            setScanning(false);
            setTimeout(() => setScanning(true), 1500);
          }
        } else {
          showNotification(
            "Check-in Failed",
            updateResult.error || "An error occurred",
            "error"
          );
        }
      } catch (error) {
        console.error("Error processing scan:", error);
        showNotification("Error", "Failed to process scan data", "error");
      }
    }
  };

  const toggleScanner = () => {
    setScanning((prev) => !prev);
  };

  const clearResults = () => {
    setScannedResults([]);
  };

  const removeResult = (id) => {
    setScannedResults((prev) => prev.filter((result) => result.id !== id));
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      {/* Custom notification component */}
      {notification && (
        <div
          className={`fixed top-4 right-4 left-4 z-50 p-3 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform translate-y-0 ${
            notification.type === "success"
              ? "bg-green-100 text-green-800 border-l-4 border-green-500"
              : notification.type === "error"
                ? "bg-red-100 text-red-800 border-l-4 border-red-500"
                : "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500"
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              {notification.type === "success" ? (
                <CheckCircle size={20} />
              ) : notification.type === "error" ? (
                <XCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">{notification.title}</h3>
              <div className="mt-1 text-sm">{notification.message}</div>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto flex-shrink-0 -mt-1 -mr-1 p-1"
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>
      )}

      <Card className="mb-4 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span>QR Attendance Scanner</span>
            <Button
              variant={scanning ? "destructive" : "default"}
              onClick={toggleScanner}
              size="sm"
              className="rounded-full px-4"
              disabled={processing}
            >
              {scanning ? "Pause Scanner" : "Resume Scanner"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scanning ? (
            <div className="relative w-full overflow-hidden rounded-lg mb-4">
              <div className="scanner-wrapper aspect-square w-full overflow-hidden rounded-lg relative">
                {/* Processing overlay */}
                {processing && (
                  <div className="absolute inset-0 z-20 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg flex items-center gap-2">
                      <Loader2
                        className="animate-spin text-primary"
                        size={24}
                      />
                      <span>Processing...</span>
                    </div>
                  </div>
                )}

                {/* Custom overlay for scanner */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "70%",
                      height: "70%",
                      border: "2px solid rgba(255, 255, 255, 0.7)",
                      borderRadius: "12px",
                      boxShadow: "0 0 0 1000px rgba(0, 0, 0, 0.3)",
                    }}
                  />
                </div>

                {/* Scanner component with minimal styling */}
                <div
                  className="scanner-container"
                  style={{ width: "100%", height: "100%" }}
                >
                  <Scanner
                    onScan={handleScan}
                    onError={(error) => console.error("Scanning error:", error)}
                    scanDelay={500}
                    containerStyle={{
                      width: "100%",
                      height: "100%",
                      padding: 0,
                      border: "none",
                      borderRadius: "8px",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  />
                </div>
              </div>

              {/* Helper text overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-center text-xs rounded-b-lg">
                Position participant QR code within the frame
              </div>
            </div>
          ) : (
            <div className="aspect-square w-full bg-gray-100 flex flex-col items-center justify-center rounded-lg mb-4">
              <p className="text-gray-500 mb-2">Scanner paused</p>
              {processing && (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin text-primary" size={20} />
                  <span className="text-sm">Processing last scan...</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center text-lg">
            <span>Attendance Records ({scannedResults.length})</span>
            {scannedResults.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearResults}
                className="text-xs rounded-full px-3 py-1 h-7"
              >
                Clear All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scannedResults.length === 0 ? (
            <div className="text-center p-6 text-gray-500">
              <p>No participations checked in yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {scannedResults.map((scan) => (
                <div
                  key={scan.id}
                  className={`p-3 rounded-md relative border transition-all ${
                    scan.success
                      ? "bg-green-50 border-green-100"
                      : "bg-red-50 border-red-100"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {scan.success ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <XCircle size={16} className="text-red-500" />
                        )}
                        <span className="font-medium">
                          {scan.participantName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 block">
                        {scan.timestamp}
                      </span>
                      <span className="text-xs font-mono block mt-1 text-gray-600">
                        ID: {scan.participationId?.substring(0, 10)}...
                      </span>
                    </div>
                    <button
                      onClick={() => removeResult(scan.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                  {/* Collapsible details button */}
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">
                      Show details
                    </summary>
                    <pre className="text-xs mt-2 bg-black bg-opacity-5 p-2 rounded overflow-auto">
                      {scan.data}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success animation overlay */}
      <div
        id="success-animation"
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-none opacity-0 transition-opacity duration-300"
      >
        <div className="bg-white rounded-lg p-8 flex flex-col items-center max-w-xs mx-auto">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h3 className="text-xl font-bold mb-1">Success!</h3>
          <p className="text-center text-gray-600" id="success-message">
            Attendance recorded successfully
          </p>
        </div>
      </div>

      {/* More aggressive global styles */}
      <style jsx global>{`
        /* Hide all SVGs inside scanner container */
        .scanner-container svg,
        div[style*="position: absolute"] svg,
        [class*="react-qr-scanner"] svg {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }

        /* Hide all paths that might create lines */
        .scanner-container path,
        div[style*="position: absolute"] path,
        [class*="react-qr-scanner"] path {
          display: none !important;
          stroke: transparent !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }

        /* Ensure proper camera view filling */
        .scanner-container video,
        [class*="react-qr-scanner"] video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 8px !important;
        }

        /* Override any viewFinder styles */
        [class*="react-qr-scanner"] > div:not(:first-child) {
          border: none !important;
          background: transparent !important;
        }

        /* Success animation keyframes */
        @keyframes successPop {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          75% {
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .success-show {
          opacity: 1 !important;
          animation: successPop 0.5s ease-out forwards;
        }

        /* Check mark animation */
        @keyframes checkmark {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .checkmark-circle {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: checkmark 1s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

// Helper function to show success animation
function showSuccessAnimation(message) {
  const animation = document.getElementById("success-animation");
  const messageEl = document.getElementById("success-message");

  if (animation && messageEl) {
    messageEl.textContent = message || "Attendance recorded successfully";
    animation.classList.add("success-show");

    setTimeout(() => {
      animation.classList.remove("success-show");
    }, 2000);
  }
}

export default QRScannerPage;
