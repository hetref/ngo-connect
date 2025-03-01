import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { useState, useEffect } from "react"
import { onSnapshot, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function DonationReports({ timeFrame }) {
  const [donations, setDonations] = useState([])
  const [donationStats, setDonationStats] = useState({
    total: 0,
    breakdown: [],
    topDonors: []
  })

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "donationApprovals"),
      (snapshot) => {
        const donationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setDonations(donationsData)
        
        // Calculate statistics
        const total = donationsData.reduce((sum, donation) => sum + Number(donation.amount || 0), 0)
        
        // Calculate breakdown by payment method
        const methodBreakdown = donationsData.reduce((acc, donation) => {
          const method = donation.paymentMethod || "Other"
          acc[method] = (acc[method] || 0) + Number(donation.amount || 0)
          return acc
        }, {})
        
        const breakdown = Object.entries(methodBreakdown).map(([method, amount]) => ({
          method,
          amount
        }))

        // Get top donors
        const topDonors = [...donationsData]
          .sort((a, b) => Number(b.amount) - Number(a.amount))
          .slice(0, 3)
          .map(donor => ({
            name: donor.donorName,
            amount: Number(donor.amount),
            date: donor.date
          }))

        setDonationStats({
          total,
          breakdown,
          topDonors
        })
      }
    )

    return () => unsubscribe()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Donation Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-4">Total Donations: ₹{donationStats.total.toLocaleString()}</div>
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
                      <TableCell>₹{item.amount.toLocaleString()}</TableCell>
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
                    >
                      {donationStats.breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
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
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.slice(0, 5).map((donation, index) => (
                <TableRow key={donation.id}>
                  <TableCell>{donation.donorName}</TableCell>
                  <TableCell>₹{Number(donation.amount).toLocaleString()}</TableCell>
                  <TableCell>{donation.date}</TableCell>
                  <TableCell>{donation.paymentMethod || "Other"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        donation.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : donation.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {donation.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

