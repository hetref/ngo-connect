"use client";

import { motion } from "framer-motion";
import { Download, FileText, BarChart, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase"; // Import Firebase
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import Link from "next/link";

export default function UserDonatePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [donationOverview, setDonationOverview] = useState({
    totalDonations: 0,
    sponsoredEvents: 0,
    upcomingRecurring: 0,
  });
  const [recentDonations, setRecentDonations] = useState([]);
  const [donorInfo, setDonorInfo] = useState({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;

        if (!user) {
          console.error("No user logged in");
          setLoading(false);
          return;
        }

        const userId = user.uid;

        // Fetch user profile data
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          // Set donor info
          setDonorInfo({
            name: userData.name || userData.displayName || "",
            email: userData.email || user.email || "",
          });

          // Set total donations
          setDonationOverview((prev) => ({
            ...prev,
            totalDonations: userData.totalDonated || 0,
          }));
        }

        // Fetch donation count (to how many NGOs)
        const donateToRef = collection(db, "users", userId, "donatedTo");
        const donateToSnap = await getDocs(donateToRef);
        const uniqueNgos = new Set();

        donateToSnap.forEach((doc) => {
          uniqueNgos.add(doc.id);
        });

        setDonationOverview((prev) => ({
          ...prev,
          sponsoredEvents: uniqueNgos.size,
        }));

        // Get current date information for fetching current month donations
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear().toString();
        const currentMonth = currentDate.getMonth().toString(); // 0-indexed months
        console.log(currentMonth, currentYear);
        // Fetch recent donations
        const recentDonationsArray = [];

        for (const ngoId of uniqueNgos) {
          // Fetch NGO name
          const ngoRef = doc(db, "ngo", ngoId);
          const ngoSnap = await getDoc(ngoRef);
          const ngoName = ngoSnap.exists()
            ? ngoSnap.data().ngoName
            : "Unknown NGO";

          // Fetch donations for this NGO
          console.log(userId);
          const donationsPath = `users/${userId}/${currentYear}/${currentMonth}/${ngoId}`;
          const donationsRef = collection(db, donationsPath);
          const donationsSnap = await getDocs(donationsRef);

          donationsSnap.forEach((donationDoc) => {
            const donationData = donationDoc.data();
            recentDonationsArray.push({
              id: donationDoc.id,
              ngo: ngoName,
              amount: donationData.amount || 0,
              date: donationData.donatedOn
                ? new Date(donationData.donatedOn.seconds * 1000)
                    .toISOString()
                    .split("T")[0]
                : "",
              method: donationData.type || "Unknown",
              status: "Completed", // Assuming all stored donations are completed
              ngoId: ngoId,
            });
          });
        }

        // Sort by date (newest first) and set state
        recentDonationsArray.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setRecentDonations(recentDonationsArray);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Function to create a printable window with the tax receipt
  const generateTaxReceipt = () => {
    setIsGenerating(true);

    try {
      // Get completed donations
      const completedDonations = recentDonations.filter(
        (d) => d.status === "Completed"
      );

      // Calculate total amount
      const totalAmount = completedDonations.reduce(
        (sum, d) => sum + d.amount,
        0
      );

      // Create receipt number
      const receiptNumber = `R-${Math.floor(Math.random() * 10000)}-${new Date().getFullYear()}`;

      // Generate receipt date
      const receiptDate = new Date().toISOString().split("T")[0];

      // Create HTML content for the receipt
      let receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tax Receipt for Donations</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { color: #1CAC78; text-align: center; font-size: 24px; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
            .info-line { margin: 5px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #1CAC78; color: white; text-align: left; padding: 8px; }
            td { border: 1px solid #ddd; padding: 8px; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .total { font-weight: bold; margin: 20px 0; }
            .disclaimer { font-size: 10px; margin-top: 30px; font-style: italic; }
            .signature { text-align: right; margin-top: 50px; }
            @media print {
              button { display: none; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">Tax Receipt for Donations</div>
          
          <div class="section">
            <div class="section-title">Donor Details:</div>
            <div class="info-line">Name: ${donorInfo.name}</div>
            <div class="info-line">Email: ${donorInfo.email}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Receipt Details:</div>
            <div class="info-line">Receipt Date: ${receiptDate}</div>
            <div class="info-line">Receipt Number: ${receiptNumber}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Donation Details:</div>
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Deduction Type</th>
                </tr>
              </thead>
              <tbody>
      `;

      // Add rows for donations
      completedDonations.forEach((donation) => {
        receiptHTML += `
          <tr>
            <td>${donation.ngo}</td>
            <td>₹${donation.amount}</td>
            <td>${donation.date}</td>
            <td>${donation.method}</td>
            <td>80G</td>
          </tr>
        `;
      });

      // Complete the HTML
      receiptHTML += `
              </tbody>
            </table>
            
            <div class="total">Total Donations: ₹${totalAmount}</div>
          </div>
          
          <div class="disclaimer">
            This receipt is electronically generated and is valid for income tax purposes under Section 80G of the Income Tax Act, 1961.
          </div>
          
          <div class="signature">
            Authorized Signatory
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()">Print Receipt</button>
          </div>
        </body>
        </html>
      `;

      // Open in a new window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
      } else {
        alert(
          "Please allow popups for this website to view and print tax receipts."
        );
      }
    } catch (error) {
      console.error("Error generating tax receipt:", error);
      alert("Failed to generate tax receipt. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to open individual receipt in new window
  const viewIndividualReceipt = (donation) => {
    try {
      // Create receipt number
      const receiptNumber = `R-${donation.id}-${new Date().getFullYear()}`;

      // Create HTML content for the individual receipt
      let receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Donation Receipt: ${donation.ngo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { color: #1CAC78; text-align: center; font-size: 24px; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
            .info-line { margin: 5px 0; font-size: 12px; }
            .disclaimer { font-size: 10px; margin-top: 30px; font-style: italic; }
            .signature { text-align: right; margin-top: 50px; }
            @media print {
              button { display: none; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">Donation Receipt: ${donation.ngo}</div>
          
          <div class="section">
            <div class="section-title">Donor Details:</div>
            <div class="info-line">Name: ${donorInfo.name}</div>
            <div class="info-line">Email: ${donorInfo.email}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Donation Details:</div>
            <div class="info-line">Organization: ${donation.ngo}</div>
            <div class="info-line">Amount: ₹${donation.amount}</div>
            <div class="info-line">Date: ${donation.date}</div>
            <div class="info-line">Payment Method: ${donation.method}</div>
            <div class="info-line">Status: ${donation.status}</div>
            <div class="info-line">Receipt Number: ${receiptNumber}</div>
          </div>
          
          <div class="disclaimer">
            This receipt is electronically generated and is valid for income tax purposes under Section 80G of the Income Tax Act, 1961.
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()">Print Receipt</button>
          </div>
        </body>
        </html>
      `;

      // Open in a new window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
      } else {
        alert(
          "Please allow popups for this website to view and print tax receipts."
        );
      }
    } catch (error) {
      console.error("Error generating individual receipt:", error);
      alert("Failed to generate receipt. Please try again later.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-3xl font-bold mb-8">Donations</h1>

      {loading ? (
        <div className="text-center py-8">
          <p>Loading your donation data...</p>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Donations Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold">
                    ₹{donationOverview.totalDonations}
                  </h3>
                  <p className="text-gray-500">Total Donations Made</p>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold">
                    {donationOverview.sponsoredEvents}
                  </h3>
                  <p className="text-gray-500">Total NGOs Supported</p>
                </div>
                {/* <div className="text-center">
                  <h3 className="text-2xl font-bold">
                    ₹{donationOverview.upcomingRecurring}
                  </h3>
                  <p className="text-gray-500">Upcoming Recurring Donations</p>
                </div> */}
              </div>
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={generateTaxReceipt}
                  disabled={isGenerating || recentDonations.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isGenerating ? "Generating..." : "Download Tax Receipt"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {recentDonations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NGO</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDonations.map((donation) => (
                      <TableRow key={`${donation.ngoId}-${donation.id}`}>
                        <TableCell>{donation.ngo}</TableCell>
                        <TableCell>₹{donation.amount}</TableCell>
                        <TableCell>{donation.date}</TableCell>
                        <TableCell>{donation.method}</TableCell>
                        <TableCell>
                          <Badge variant="default">{donation.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewIndividualReceipt(donation)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Receipt
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p>You haven't made any donations yet.</p>
              </CardContent>
            </Card>
          )}

          <div className="text-center space-x-4">
            <Link href="/ngo">
              <Button className="bg-[#1CAC78] hover:bg-[#158f63]">
                Donate to a Cause Now!
              </Button>
            </Link>
          </div>
        </>
      )}
    </motion.div>
  );
}
