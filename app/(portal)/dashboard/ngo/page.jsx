"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Joyride from "react-joyride";
import { MetricsOverview } from "@/components/ngo-dashboard/metrics-overview";
import { QuickActions } from "@/components/ngo-dashboard/quick-actions";
import { RecentActivities } from "@/components/ngo-dashboard/recent-activities";
import { ReportsSection } from "@/components/ngo-dashboard/reports-section";
import { HelpCircle } from "lucide-react"; // Import icon for help button

export default function DashboardPage() {
  const [ngoName, setNgoName] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runTour, setRunTour] = useState(false);
  const [showRestartButton, setShowRestartButton] = useState(false);

  useEffect(() => {
    const fetchNgoName = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          setError("User not found");
          setLoading(false);
          return;
        }
        const ngoId = userDoc.data().ngoId;
        if (!ngoId) {
          setError("No NGO associated with this user");
          setLoading(false);
          return;
        }
        const ngoDocRef = doc(db, "ngo", ngoId);
        const ngoDoc = await getDoc(ngoDocRef);
        if (!ngoDoc.exists()) {
          setError("NGO not found");
          setLoading(false);
          return;
        }
        setNgoName(ngoDoc.data().ngoName || "Unnamed NGO");
        setLoading(false);

        // Check if tour should run
        const hasSeenTour = localStorage.getItem("hasSeenDashboardTour");
        if (!hasSeenTour) {
          // Wait a bit for the UI to fully render before starting the tour
          setTimeout(() => {
            setRunTour(true);
          }, 1000);
          localStorage.setItem("hasSeenDashboardTour", "true");
        } else {
          // If user has seen the tour, show the restart button
          setShowRestartButton(true);
        }
      } catch (err) {
        console.error("Error fetching NGO name:", err);
        setError("Failed to load NGO information");
        setLoading(false);
      }
    };
    fetchNgoName();
  }, []);

  // Handle tour callbacks
  const handleTourCallback = (data) => {
    const { status } = data;
    // When the dashboard tour ends (either completed or skipped), show restart button and trigger sidebar tour
    if (status === "finished" || status === "skipped") {
      setShowRestartButton(true);

      // Dispatch a custom event that the SideNav component will listen for
      const event = new CustomEvent("startSidebarTour", {
        detail: { startTour: true },
      });
      window.dispatchEvent(event);
    }
  };

  // Start both tours from beginning
  const handleRestartTour = () => {
    // Reset both tours in localStorage
    localStorage.removeItem("hasSeenDashboardTour");
    localStorage.removeItem("hasCompletedFullTour");

    // Start the dashboard tour
    setRunTour(true);

    // Hide restart button during tour
    setShowRestartButton(false);
  };

  // Joyride Steps for Dashboard
  const tourSteps = [
    {
      target: "#dashboard-title",
      content:
        "Welcome to your NGO dashboard! This is your central hub for managing all NGO activities.",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "#metrics-overview",
      content:
        "Here you can track your donations, beneficiaries reached, and other key performance metrics.",
      placement: "top",
    },
    {
      target: "#quick-actions",
      content:
        "Use these quick actions to perform key tasks faster, like creating new campaigns or registering beneficiaries.",
      placement: "bottom",
    },
    {
      target: "#recent-activities",
      content:
        "See all your recent activities and updates here, helping you stay on top of what's happening.",
      placement: "bottom",
    },
    {
      target: "#reports-section",
      content:
        "Generate and analyze reports for your NGO's performance and track your impact over time.",
      placement: "top",
    },
  ];

  // CSS to highlight elements during tour
  useEffect(() => {
    if (runTour) {
      // Add CSS for tour highlighting
      const styleEl = document.createElement("style");
      styleEl.id = "tour-highlighting-styles";
      styleEl.innerHTML = `
        .react-joyride__spotlight {
          border: 3px solid #1CAC78 !important;
          box-shadow: 0 0 15px rgba(28, 172, 120, 0.5) !important;
        }
      `;
      document.head.appendChild(styleEl);

      return () => {
        // Clean up when tour ends
        const styleElement = document.getElementById(
          "tour-highlighting-styles"
        );
        if (styleElement) {
          styleElement.remove();
        }
      };
    }
  }, [runTour]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto relative"
    >
      <h1 id="dashboard-title" className="mb-8 text-3xl font-bold md:text-4xl">
        {loading
          ? "Loading..."
          : error
            ? "NGO Dashboard"
            : `${ngoName} NGO Dashboard`}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          id="metrics-overview"
          className="col-span-full sm:col-span-2 lg:col-span-4"
        >
          <MetricsOverview type="Donations" />
        </div>
        <div id="quick-actions" className="sm:col-span-1 lg:col-span-2">
          <QuickActions />
        </div>
        <div id="recent-activities" className="sm:col-span-1 lg:col-span-2">
          <RecentActivities />
        </div>
        <div
          id="reports-section"
          className="col-span-full sm:col-span-2 lg:col-span-4"
        >
          <ReportsSection />
        </div>
      </div>

      {/* Restart Tour Button */}
      {showRestartButton && (
        <button
          id="restart-tour-button"
          onClick={handleRestartTour}
          className="fixed animate-pulse top-6 right-6 bg-[#1CAC78] text-white flex items-center gap-2 px-4 py-2 rounded-full shadow-lg hover:bg-[#18a06e] transition-colors z-50"
          aria-label="Restart Tour"
        >
          <HelpCircle size={18} />
          <span>Restart Guide Tour</span>
        </button>
      )}

      {/* React Joyride Tour */}
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        scrollToFirstStep
        disableOverlayClose
        spotlightClicks
        callback={handleTourCallback}
        styles={{
          options: {
            zIndex: 10000,
            arrowColor: "#1CAC78",
            backgroundColor: "#fff",
            overlayColor: "rgba(0, 0, 0, 0.5)",
            primaryColor: "#1CAC78",
            textColor: "#333",
            spotlightPadding: 15, // Increased padding
          },
          tooltip: {
            fontSize: "14px",
            padding: "15px",
            boxShadow: "0 0 20px rgba(0, 0, 0, 0.3)",
          },
          buttonNext: {
            backgroundColor: "#1CAC78",
          },
          buttonBack: {
            color: "#1CAC78",
          },
          spotlight: {
            backgroundColor: "transparent",
          },
        }}
      />
    </motion.div>
  );
}
