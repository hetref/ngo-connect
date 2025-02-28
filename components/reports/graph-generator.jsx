"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const mockData = {
  donations: [
    { month: "Jan", amount: 5000 },
    { month: "Feb", amount: 7000 },
    { month: "Mar", amount: 6000 },
    { month: "Apr", amount: 8000 },
    { month: "May", amount: 9000 },
    { month: "Jun", amount: 10000 },
  ],
  activities: [
    { month: "Jan", count: 5 },
    { month: "Feb", count: 7 },
    { month: "Mar", count: 6 },
    { month: "Apr", count: 8 },
    { month: "May", count: 9 },
    { month: "Jun", count: 10 },
  ],
  members: [
    { month: "Jan", count: 100 },
    { month: "Feb", count: 120 },
    { month: "Mar", count: 130 },
    { month: "Apr", count: 140 },
    { month: "May", count: 160 },
    { month: "Jun", count: 180 },
  ],
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function GraphGenerator({ timeFrame }) {
  const [graphType, setGraphType] = useState("bar")
  const [dataSource, setDataSource] = useState("donations")

  const renderGraph = () => {
    const data = mockData[dataSource]

    switch (graphType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={dataSource === "donations" ? "amount" : "count"} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={dataSource === "donations" ? "amount" : "count"} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        )
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataSource === "donations" ? "amount" : "count"}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Graph Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 mb-4">
          <Select value={graphType} onValueChange={setGraphType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select graph type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dataSource} onValueChange={setDataSource}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select data source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="donations">Donations</SelectItem>
              <SelectItem value="activities">Activities</SelectItem>
              <SelectItem value="members">Members</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {renderGraph()}
      </CardContent>
    </Card>
  )
}

