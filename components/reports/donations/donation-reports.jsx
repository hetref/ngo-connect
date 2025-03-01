import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { useState, useEffect } from "react";
import {
  onSnapshot,
  collection,
  query,
  getDocs,
  collectionGroup,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download, DownloadCloud } from "lucide-react";
import DonationReportPDF from "./donation-report-pdf";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function DonationReports({ timeFrame }) {
  const [donations, setDonations] = useState([]);
  const [donationStats, setDonationStats] = useState({
    total: 0,
    breakdown: [],
    topDonors: []
  })
  // Add state for view more toggles
  const [showAllCash, setShowAllCash] = useState(false)
  const [showAllOnline, setShowAllOnline] = useState(false)
  const [showAllCrypto, setShowAllCrypto] = useState(false)

  useEffect(() => {
    // Get current year
    const currentYear = new Date().getFullYear().toString();

    const fetchDonations = async () => {
      try {
        const ngoId = auth.currentUser?.uid;
        if (!ngoId) {
          console.log("No NGO ID found");
          return;
        }

        console.log("Fetching donations for NGO:", ngoId);

        let allDonations = [];

        // Fetch all cash donations using collectionGroup
        const cashDonations = await getDocs(collectionGroup(db, "cash"));
        cashDonations.forEach((doc) => {
          // Only include donations that belong to this NGO and year
          const path = doc.ref.path;
          if (path.includes(`donations/${ngoId}/${currentYear}`)) {
            allDonations.push({
              id: doc.id,
              ...doc.data(),
              paymentMethod: "Cash",
            });
          }
        });

        // Fetch all online donations
        const onlineDonations = await getDocs(collectionGroup(db, "online"));
        onlineDonations.forEach((doc) => {
          // Only include donations that belong to this NGO and year
          const path = doc.ref.path;
          if (path.includes(`donations/${ngoId}/${currentYear}`)) {
            allDonations.push({
              id: doc.id,
              ...doc.data(),
              paymentMethod: "Online",
            });
          }
        });

        // Fetch all crypto donations
        const cryptoDonations = await getDocs(collectionGroup(db, "crypto"));
        cryptoDonations.forEach((doc) => {
          // Only include donations that belong to this NGO and year
          const path = doc.ref.path;
          if (path.includes(`donations/${ngoId}/${currentYear}`)) {
            allDonations.push({
              id: doc.id,
              ...doc.data(),
              paymentMethod: "Crypto",
            });
          }
        });

        console.log("Raw Donations Data:", allDonations);
        setDonations(allDonations);

        // Calculate statistics (excluding crypto)
        const total = allDonations
          .filter((donation) => donation.paymentMethod !== "Crypto")
          .reduce((sum, donation) => sum + Number(donation.amount || 0), 0);
        console.log("Total Donations (excluding crypto):", total);

        // Calculate breakdown by payment method
        const methodBreakdown = allDonations.reduce((acc, donation) => {
          const method = donation.paymentMethod || "Other";
          acc[method] = (acc[method] || 0) + Number(donation.amount || 0);
          return acc;
        }, {});
        console.log("Payment Method Breakdown:", methodBreakdown);

        const breakdown = Object.entries(methodBreakdown).map(
          ([method, amount]) => ({
            method,
            amount,
          })
        );
        console.log("Formatted Breakdown Data:", breakdown);

        // Get top donors (excluding crypto)
        const topDonors = [...allDonations]
          .filter((donation) => donation.paymentMethod !== "Crypto")
          .sort((a, b) => Number(b.amount) - Number(a.amount))
          .slice(0, 3)
          .map((donor) => ({
            name: donor.name || donor.donorName,
            amount: Number(donor.amount),
            date: donor.timestamp || donor.donatedOn,
          }));
        console.log("Top Donors:", topDonors);

        const stats = {
          total,
          breakdown,
          topDonors,
        };
        console.log("Final Donation Stats:", stats);
        setDonationStats(stats);
      } catch (error) {
        console.error("Error fetching donations:", error);
      }
    };

    fetchDonations();
  }, []);

  // Filter functions for different donation types and sort by date
  const cashDonations = donations
    .filter(d => d.paymentMethod === 'Cash')
    .sort((a, b) => {
      const dateA = new Date(a.donatedOn || a.timestamp || 0);
      const dateB = new Date(b.donatedOn || b.timestamp || 0);
      return dateB - dateA;
    });

  const onlineDonations = donations
    .filter(d => d.paymentMethod === 'Online')
    .sort((a, b) => {
      const dateA = new Date(a.timestamp || a.id || 0);
      const dateB = new Date(b.timestamp || b.id || 0);
      return dateB - dateA;
    });

  const cryptoDonations = donations
    .filter(d => d.paymentMethod === 'Crypto')
    .sort((a, b) => {
      const dateA = new Date(a.timestamp || a.id || 0);
      const dateB = new Date(b.timestamp || b.id || 0);
      return dateB - dateA;
    });

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (!(date instanceof Date) || isNaN(date)) return 'Invalid date';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generatePDFData = () => {
    return {
      ngoInfo: {
        name: "Your NGO Name", // Replace with actual NGO name
        address: "Your NGO Address",
        email: "your@email.com",
      },
      timeFrame: timeFrame || "All Time",
      total: donationStats.total,
      cryptoTotal: donations
        .filter((d) => d.paymentMethod === "Crypto")
        .reduce((sum, d) => sum + Number(d.amount || 0), 0),
      totalDonors: new Set(donations.map((d) => d.name)).size,
      breakdown: donationStats.breakdown,
      cashDonations: cashDonations.slice(0, 5),
      onlineDonations: onlineDonations.slice(0, 5),
      cryptoDonations: cryptoDonations.slice(0, 5),
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Donation Overview</CardTitle>
            <PDFDownloadLink
              document={<DonationReportPDF reportData={generatePDFData()} />}
              fileName="donation-report.pdf"
              className="bg-black text-white p-2 rounded-lg"
            >
              {({ blob, url, loading, error }) =>
                loading ? "Loading document..." : " Download PDF Report"
              }
            </PDFDownloadLink>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-4">
            Total Donations: ₹{donationStats.total.toLocaleString()}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Donation Breakdown</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donationStats.breakdown.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.method}</TableCell>
                      <TableCell>
                        {
                          item.method === "Crypto"
                            ? item.amount.toLocaleString() // No ₹ symbol for crypto
                            : `₹${item.amount.toLocaleString()}` // Keep ₹ for other methods
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Donation Methods</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donationStats.breakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      label={({ method, amount }) =>
                        method === "Crypto"
                          ? `${amount.toLocaleString()} Tokens`
                          : `₹${amount.toLocaleString()}`
                      }
                    >
                      {donationStats.breakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value) =>
                        value === "Crypto" ? "Crypto (Tokens)" : value
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cash Donations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(showAllCash ? cashDonations : cashDonations.slice(0, 5)).map((donation, index) => (
                <TableRow key={donation.id || index}>
                  <TableCell>{donation.name}</TableCell>
                  <TableCell>₹{Number(donation.amount).toLocaleString()}</TableCell>
                  <TableCell>{formatDate(donation.donatedOn || donation.timestamp)}</TableCell>
                  <TableCell>{donation.paymentMethod}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {cashDonations.length > 5 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowAllCash(!showAllCash)}
              >
                {showAllCash ? "Show Less" : `View More (${cashDonations.length - 5} more)`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>UPI Donations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(showAllOnline ? onlineDonations : onlineDonations.slice(0, 5)).map((donation, index) => (
                <TableRow key={donation.id || index}>
                  <TableCell>{donation.name}</TableCell>
                  <TableCell>₹{Number(donation.amount).toLocaleString()}</TableCell>
                  <TableCell>{formatDate(donation.timestamp || donation.id)}</TableCell>
                  <TableCell>{donation.paymentMethod}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {onlineDonations.length > 5 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowAllOnline(!showAllOnline)}
              >
                {showAllOnline ? "Show Less" : `View More (${onlineDonations.length - 5} more)`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cryptocurrency Donations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(showAllCrypto ? cryptoDonations : cryptoDonations.slice(0, 5)).map((donation, index) => (
                <TableRow key={donation.id || index}>
                  <TableCell>{donation.name}</TableCell>
                  <TableCell>{donation.amount}</TableCell>
                  <TableCell>{formatDate(donation.timestamp || donation.id)}</TableCell>
                  <TableCell>{donation.paymentMethod}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {cryptoDonations.length > 5 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowAllCrypto(!showAllCrypto)}
              >
                {showAllCrypto ? "Show Less" : `View More (${cryptoDonations.length - 5} more)`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
