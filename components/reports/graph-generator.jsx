"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
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
import { format, parseISO, isSameMonth } from "date-fns"

// Default mock data for when no real data is provided
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export default function GraphGenerator({ timeFrame, donationsData = [], activitiesData = [] }) {
  const [graphType, setGraphType] = useState("bar")
  const [dataSource, setDataSource] = useState("donations")
  const chartRef = useRef(null)

  // Process donations data
  const processedDonationsData = donationsData && donationsData.length > 0 
    ? processDonationData(donationsData) 
    : mockData.donations

  // Process activities data
  const processedActivitiesData = activitiesData && activitiesData.length > 0
    ? processActivityData(activitiesData)
    : mockData.activities

  // Function to process donation data
  function processDonationData(donations) {
    // Group donations by month
    const monthlyData = {};
    const currentYear = new Date().getFullYear();
    
    // Initialize months
    for (let month = 0; month < 12; month++) {
      const monthName = format(new Date(currentYear, month, 1), 'MMM');
      monthlyData[monthName] = { month: monthName, amount: 0, count: 0 };
    }
    
    // Aggregate donations by month
    donations.forEach(donation => {
      const donationDate = donation.donationDate ? 
        (typeof donation.donationDate === 'string' ? parseISO(donation.donationDate) : donation.donationDate) : 
        new Date();
      
      if (donationDate.getFullYear() === currentYear) {
        const monthName = format(donationDate, 'MMM');
        monthlyData[monthName].amount += Number(donation.amount || 0);
        monthlyData[monthName].count += 1;
      }
    });
    
    // Convert to array for Recharts
    return Object.values(monthlyData);
  }

  // Function to process activity data
  function processActivityData(activities) {
    // Group activities by month
    const monthlyData = {};
    const currentYear = new Date().getFullYear();
    
    // Initialize months
    for (let month = 0; month < 12; month++) {
      const monthName = format(new Date(currentYear, month, 1), 'MMM');
      monthlyData[monthName] = { month: monthName, count: 0, participants: 0 };
    }
    
    // Aggregate activities by month
    activities.forEach(activity => {
      let activityDate;
      
      if (activity.startDate) {
        activityDate = typeof activity.startDate === 'string' ? 
          parseISO(activity.startDate) : activity.startDate;
      } else if (activity.date) {
        activityDate = typeof activity.date === 'string' ? 
          parseISO(activity.date) : activity.date;
      } else {
        activityDate = new Date(); // Default to current date if no date info
      }
      
      if (activityDate.getFullYear() === currentYear) {
        const monthName = format(activityDate, 'MMM');
        monthlyData[monthName].count += 1;
        monthlyData[monthName].participants += Number(activity.participants || activity.registeredCount || 0);
      }
    });
    
    // Convert to array for Recharts
    return Object.values(monthlyData);
  }

  // Function to download chart as PNG
  const downloadChart = () => {
    if (!chartRef.current) return;
    
    try {
      // Get SVG from chart
      const svgElement = chartRef.current.querySelector('svg');
      if (!svgElement) return;
      
      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const DOMURL = window.URL || window.webkitURL || window;
      const svgUrl = DOMURL.createObjectURL(svgBlob);
      
      // Create canvas and image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = function() {
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw SVG on canvas
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(svgUrl);
        
        // Convert to PNG and download
        const imgUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${dataSource}-${graphType}-chart.png`;
        link.href = imgUrl;
        link.click();
      };
      
      img.src = svgUrl;
    } catch (error) {
      console.error("Error downloading chart:", error);
      alert("Failed to download chart. Please try again.");
    }
  };

  const renderGraph = () => {
    // Choose the appropriate data source
    let data;
    
    switch (dataSource) {
      case "donations":
        data = processedDonationsData;
        break;
      case "activities":
        data = processedActivitiesData;
        break;
      case "members":
        data = mockData.members; // Still using mock data for members
        break;
      default:
        data = [];
    }

    // Get the correct data key for the y-axis
    const dataKey = dataSource === "donations" ? "amount" : "count";
    
    // Render the selected chart type
    switch (graphType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => dataSource === "donations" ? `$${value}` : value}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Bar 
                name={dataSource === "donations" ? "Amount ($)" : "Count"} 
                dataKey={dataKey} 
                fill="#8884d8" 
              />
              {dataSource === "activities" && 
                <Bar name="Participants" dataKey="participants" fill="#82ca9d" />
              }
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
              <Tooltip 
                formatter={(value) => dataSource === "donations" ? `$${value}` : value}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                name={dataSource === "donations" ? "Amount ($)" : "Count"}
                dataKey={dataKey} 
                stroke="#8884d8" 
                activeDot={{ r: 8 }}
              />
              {dataSource === "activities" && 
                <Line 
                  type="monotone" 
                  name="Participants" 
                  dataKey="participants" 
                  stroke="#82ca9d" 
                  activeDot={{ r: 8 }}
                />
              }
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
                labelLine={true}
                outerRadius={120}
                fill="#8884d8"
                dataKey={dataKey}
                nameKey="month"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => dataSource === "donations" ? `$${value}` : value}
              />
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
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Graph Generator</CardTitle>
        <Button onClick={downloadChart} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download PNG
        </Button>
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
        <div ref={chartRef}>
          {renderGraph()}
        </div>
      </CardContent>
    </Card>
  )
}

