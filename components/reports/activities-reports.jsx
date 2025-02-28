import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const mockActivityData = {
  total: 25,
  breakdown: [
    { category: "Health Camps", count: 5, impact: "500 patients treated" },
    { category: "Educational Workshops", count: 8, impact: "300 students trained" },
    { category: "Awareness Campaigns", count: 7, impact: "1000 people reached" },
    { category: "Community Development", count: 5, impact: "3 projects completed" },
  ],
  volunteers: 150,
  fundsSpent: 75000,
}

export default function ActivitiesReports({ timeFrame }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activities Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-4">Total Activities: {mockActivityData.total}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Activity Breakdown</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockActivityData.breakdown.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>{item.impact}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Activities by Category</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockActivityData.breakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Volunteer Engagement & Funds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Volunteer Participation</h3>
              <p className="text-2xl font-bold">{mockActivityData.volunteers} Volunteers</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Funds Spent on Activities</h3>
              <p className="text-2xl font-bold">₹{mockActivityData.fundsSpent.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

