import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

const mockDonationData = {
  total: 150000,
  breakdown: [
    { method: "Cash", amount: 50000 },
    { method: "UPI", amount: 60000 },
    { method: "Bank Transfer", amount: 30000 },
    { method: "Cryptocurrency", amount: 10000 },
  ],
  topDonors: [
    { name: "John Doe", amount: 20000, date: "2023-07-15" },
    { name: "Jane Smith", amount: 15000, date: "2023-07-20" },
    { name: "Acme Corp", amount: 25000, date: "2023-07-25" },
  ],
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function DonationReports({ timeFrame }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Donation Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-4">Total Donations: ₹{mockDonationData.total.toLocaleString()}</div>
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
                  {mockDonationData.breakdown.map((item, index) => (
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
                      data={mockDonationData.breakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {mockDonationData.breakdown.map((entry, index) => (
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
          <CardTitle>Top Donors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDonationData.topDonors.map((donor, index) => (
                <TableRow key={index}>
                  <TableCell>{donor.name}</TableCell>
                  <TableCell>₹{donor.amount.toLocaleString()}</TableCell>
                  <TableCell>{donor.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

