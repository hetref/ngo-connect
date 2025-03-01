"use client"

import { motion } from "framer-motion"
import { Download, FileText, BarChart, MessageCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useState } from "react"

// Mock data for demonstration
const donationOverview = {
  totalDonations: 25000,
  sponsoredEvents: 5,
  upcomingRecurring: 1000,
}

const recentDonations = [
  { id: 1, ngo: "Clean Oceans", amount: 5000, date: "2023-07-15", method: "UPI", status: "Completed" },
  { id: 2, ngo: "Green Earth", amount: 3000, date: "2023-06-20", method: "Credit Card", status: "Completed" },
  { id: 3, ngo: "Feeding India", amount: 2000, date: "2023-05-10", method: "Net Banking", status: "Completed" },
]

const sponsoredEvents = [
  { id: 1, name: "Annual Fundraiser", ngo: "Education for All", amount: 10000, date: "2023-08-01" },
  { id: 2, name: "Marathon for Health", ngo: "Health First", amount: 5000, date: "2023-09-15" },
]

const impactData = [
  { month: "Jan", beneficiaries: 50 },
  { month: "Feb", beneficiaries: 80 },
  { month: "Mar", beneficiaries: 120 },
  { month: "Apr", beneficiaries: 200 },
  { month: "May", beneficiaries: 180 },
  { month: "Jun", beneficiaries: 250 },
]

// Sample donor information
const donorInfo = {
  name: "Ayushi Jadhav",
  email: "ayushijadhav2006@gmail.com",
}

export default function UserDonatePage() {
  const [isGenerating, setIsGenerating] = useState(false);

  // Function to create a printable window with the tax receipt
  const generateTaxReceipt = () => {
    setIsGenerating(true);
    
    try {
      // Get completed donations
      const completedDonations = recentDonations.filter(d => d.status === "Completed");
      
      // Calculate total amount
      const totalAmount = completedDonations.reduce((sum, d) => sum + d.amount, 0) + 
                         sponsoredEvents.reduce((sum, e) => sum + e.amount, 0);
      
      // Create receipt number
      const receiptNumber = `R-${Math.floor(Math.random() * 10000)}-${new Date().getFullYear()}`;
      
      // Generate receipt date
      const receiptDate = new Date().toISOString().split('T')[0];
      
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
      completedDonations.forEach(donation => {
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
      
      // Add rows for sponsored events
      sponsoredEvents.forEach(event => {
        receiptHTML += `
          <tr>
            <td>${event.name} (${event.ngo})</td>
            <td>₹${event.amount}</td>
            <td>${event.date}</td>
            <td>Sponsorship</td>
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
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
      } else {
        alert("Please allow popups for this website to view and print tax receipts.");
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
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
      } else {
        alert("Please allow popups for this website to view and print tax receipts.");
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

      <Card>
        <CardHeader>
          <CardTitle>Donations Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold">₹{donationOverview.totalDonations}</h3>
              <p className="text-gray-500">Total Donations Made</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">{donationOverview.sponsoredEvents}</h3>
              <p className="text-gray-500">Total Sponsored Events</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">₹{donationOverview.upcomingRecurring}</h3>
              <p className="text-gray-500">Upcoming Recurring Donations</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={generateTaxReceipt}
              disabled={isGenerating}
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Download Tax Receipt"}
            </Button>
          </div>
        </CardContent>
      </Card>

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
                <TableRow key={donation.id}>
                  <TableCell>{donation.ngo}</TableCell>
                  <TableCell>₹{donation.amount}</TableCell>
                  <TableCell>{donation.date}</TableCell>
                  <TableCell>{donation.method}</TableCell>
                  <TableCell>
                    <Badge variant={donation.status === "Completed" ? "default" : "secondary"}>{donation.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => viewIndividualReceipt(donation)}
                      disabled={donation.status !== "Completed"}
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

      <Card>
        <CardHeader>
          <CardTitle>Sponsored Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sponsoredEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold">{event.name}</h3>
                  <p className="text-sm text-gray-500">{event.ngo}</p>
                  <p className="text-sm">Amount: ₹{event.amount}</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with NGO
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Impact Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={impactData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="beneficiaries" stroke="#1CAC78" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center mt-4 text-gray-500">Number of beneficiaries helped over time</p>
        </CardContent>
      </Card>

      <div className="text-center space-x-4">
        <Button className="bg-[#1CAC78] hover:bg-[#158f63]">Donate to a Cause Now!</Button>
        <Button variant="outline">Find Events to Sponsor!</Button>
      </div>
    </motion.div>
  )
}