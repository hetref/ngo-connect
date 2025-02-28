import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

const mockMemberData = {
  totalMembers: 500,
  newMembers: 50,
  roleDistribution: [
    { role: "NGO Admins", count: 10 },
    { role: "Volunteers", count: 400 },
    { role: "Coordinators", count: 90 },
  ],
  mostActiveMembers: [
    { name: "Alice Johnson", eventsParticipated: 15, hoursContributed: 45 },
    { name: "Bob Smith", eventsParticipated: 12, hoursContributed: 36 },
    { name: "Carol Williams", eventsParticipated: 10, hoursContributed: 30 },
  ],
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"]

export default function MemberReports({ timeFrame }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Member Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Total Members</h3>
              <p className="text-2xl font-bold">{mockMemberData.totalMembers}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">New Members</h3>
              <p className="text-2xl font-bold">{mockMemberData.newMembers}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Member Retention Rate</h3>
              <p className="text-2xl font-bold">
                {(
                  ((mockMemberData.totalMembers - mockMemberData.newMembers) / mockMemberData.totalMembers) *
                  100
                ).toFixed(2)}
                %
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Role Distribution</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMemberData.roleDistribution.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.role}</TableCell>
                      <TableCell>{item.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Role Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockMemberData.roleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {mockMemberData.roleDistribution.map((entry, index) => (
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
          <CardTitle>Most Active Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Events Participated</TableHead>
                <TableHead>Hours Contributed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMemberData.mostActiveMembers.map((member, index) => (
                <TableRow key={index}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.eventsParticipated}</TableCell>
                  <TableCell>{member.hoursContributed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

