"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"

const monthlyDonationData = [
  { name: "Jan", total: 4000 },
  { name: "Feb", total: 3000 },
  { name: "Mar", total: 2000 },
  { name: "Apr", total: 2780 },
  { name: "May", total: 1890 },
  { name: "Jun", total: 2390 },
  { name: "Jul", total: 3490 },
]

const weeklyDonationData = [
  { name: "Mon", total: 1000 },
  { name: "Tue", total: 1200 },
  { name: "Wed", total: 900 },
  { name: "Thu", total: 1500 },
  { name: "Fri", total: 2000 },
  { name: "Sat", total: 1800 },
  { name: "Sun", total: 1300 },
]

export function DonationsDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Stats Cards */}
      <div className="md:col-span-3 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>

            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,592.00</div>
            <p className="text-xs text-muted-foreground">2 requests pending approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Donations */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Donations</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={weeklyDonationData}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Bar 
                  dataKey="total" 
                  fill="#1CAC78" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Donations */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Donations</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyDonationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="total" 
                  fill="#1CAC78" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DonationsDashboard