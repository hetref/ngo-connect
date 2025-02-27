"use client"
import { useState, useEffect } from "react"
import { Package, FileText, RefreshCw, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, collection, getDocs, query, where, addDoc } from "firebase/firestore"
import { use } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { motion } from "framer-motion"
import { PDFDownloadLink } from '@react-pdf/renderer'
//import { ProductPDFReport } from "@/components/ProductPDFReport"
import toast, { Toaster } from 'react-hot-toast'

export default function NGOSingleProductHistoryPage({ params }) {
  const unwrappedParams = use(params)
  const [loading, setLoading] = useState(true)
  const [productDetails, setProductDetails] = useState(null)
  const [usageHistory, setUsageHistory] = useState([])
  const [stockTrend, setStockTrend] = useState([])
  const [monthlyAnalytics, setMonthlyAnalytics] = useState([])
  const [yearlyAnalytics, setYearlyAnalytics] = useState([])
  const [isRestocking, setIsRestocking] = useState(false)

  useEffect(() => {
    const fetchProductData = async () => {
      if (!unwrappedParams.productId) {
        console.error("No product ID provided")
        setLoading(false)
        return
      }

      try {
        // Fetch product details
        const productDocRef = doc(db, "products", unwrappedParams.productId)
        const productDoc = await getDoc(productDocRef)

        if (!productDoc.exists()) {
          console.error("Product not found")
          setLoading(false)
          return
        }

        const productData = productDoc.data()
        
        // Calculate expiry warning if expiryDate exists
        const expiryDate = productData.expiryDate ? new Date(productData.expiryDate) : null
        const today = new Date()
        const monthsUntilExpiry = expiryDate 
          ? Math.round((expiryDate - today) / (1000 * 60 * 60 * 24 * 30)) 
          : null
        
        setProductDetails({
          id: productDoc.id,
          ...productData,
          status: productData.quantity > 20 ? "Available" : productData.quantity > 0 ? "Low Stock" : "Out of Stock",
          monthsUntilExpiry
        })

        // Get the usedinevents array which now contains all needed information
        const usedinevents = productData.usedinevents || []
        
        // Sort the events by date in descending order
        const sortedUsageHistory = usedinevents
          .map(event => ({
            id: event.eventid,
            event: event.eventName,
            date: event.eventDate,
            used: event.assigned,
            remaining: event.remaining
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))

        setUsageHistory(sortedUsageHistory)

        // Generate stock trend data
        const trend = generateStockTrendData(sortedUsageHistory)
        setStockTrend(trend)

        // Generate monthly and yearly analytics
        const { monthlyData, yearlyData } = generateAnalytics(sortedUsageHistory)
        setMonthlyAnalytics(monthlyData)
        setYearlyAnalytics(yearlyData)
      } catch (error) {
        console.error("Error fetching product data:", error)
        toast.error("Failed to load product data")
      } finally {
        setLoading(false)
      }
    }

    fetchProductData()
  }, [unwrappedParams.productId])

  // Generate stock trend data from usage history
  const generateStockTrendData = (usageHistory) => {
    if (!usageHistory || usageHistory.length === 0) return []

    // Sort by date in ascending order for the chart
    const sortedHistory = [...usageHistory].sort((a, b) => new Date(a.date) - new Date(b.date))

    return sortedHistory.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      stock: item.remaining
    }))
  }

  // Generate monthly and yearly analytics from usage history
  const generateAnalytics = (usageHistory) => {
    if (!usageHistory || usageHistory.length === 0) {
      return { monthlyData: [], yearlyData: [] }
    }

    // Monthly analytics
    const months = {}
    const years = {}

    usageHistory.forEach(item => {
      const date = new Date(item.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
      const yearKey = date.getFullYear().toString()

      // Monthly aggregation
      if (!months[monthKey]) {
        months[monthKey] = {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          totalUsed: 0
        }
      }
      months[monthKey].totalUsed += item.used

      // Yearly aggregation
      if (!years[yearKey]) {
        years[yearKey] = {
          year: yearKey,
          totalUsed: 0
        }
      }
      years[yearKey].totalUsed += item.used
    })

    const monthlyData = Object.values(months).sort((a, b) => 
      new Date(a.month) - new Date(b.month)
    )

    const yearlyData = Object.values(years).sort((a, b) => 
      parseInt(a.year) - parseInt(b.year)
    )

    return { monthlyData, yearlyData }
  }

  // Estimate how long stock will last based on usage trends
  const estimateStockDuration = () => {
    if (!usageHistory || usageHistory.length < 2 || !productDetails) return "Unknown"

    // Calculate average monthly usage
    const monthlyUsage = calculateAverageMonthlyUsage(usageHistory)
    
    if (monthlyUsage <= 0) return "No recent usage detected"
    
    const monthsRemaining = Math.round(productDetails.quantity / monthlyUsage)
    return monthsRemaining <= 0 
      ? "Stock depleted" 
      : `${monthsRemaining} ${monthsRemaining === 1 ? 'month' : 'months'}`
  }

  const calculateAverageMonthlyUsage = (history) => {
    if (history.length < 2) return 0
    
    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date))
    const usageAmounts = []
    
    for (let i = 1; i < sortedHistory.length; i++) {
      const currentEvent = sortedHistory[i]
      const prevEvent = sortedHistory[i-1]
      
      const timeDiff = new Date(currentEvent.date) - new Date(prevEvent.date)
      const monthsDiff = timeDiff / (1000 * 60 * 60 * 24 * 30) // Rough month calculation
      
      if (monthsDiff > 0) {
        usageAmounts.push(currentEvent.used / monthsDiff)
      }
    }
    
    if (usageAmounts.length === 0) return 0
    return usageAmounts.reduce((sum, val) => sum + val, 0) / usageAmounts.length
  }

  // Handle restock request
  const handleRestockRequest = async () => {
    if (!productDetails || isRestocking) return
    
    setIsRestocking(true)
    const loadingToast = toast.loading("Submitting restock request...")
    
    try {
      // Add restock request to database
      const restockRequestsRef = collection(db, "restockRequests")
      
      // Check if there's already an active request
      const existingRequestsQuery = query(
        restockRequestsRef, 
        where("productId", "==", productDetails.id),
        where("status", "==", "pending")
      )
      
      const existingRequests = await getDocs(existingRequestsQuery)
      
      if (!existingRequests.empty) {
        toast.dismiss(loadingToast)
        toast.warning("A restock request for this product is already pending.", {
          icon: '⚠️',
          duration: 4000
        })
      } else {
        // Create a new restock request
        await addDoc(restockRequestsRef, {
          productId: productDetails.id,
          productName: productDetails.productName,
          currentQuantity: productDetails.quantity,
          requestedQuantity: 100, // Default request amount
          requestDate: new Date().toISOString(),
          status: "pending"
        })
        
        toast.dismiss(loadingToast)
        toast.success("Restock request submitted successfully!", {
          icon: '✅',
          duration: 3000
        })
      }
    } catch (error) {
      console.error("Error requesting restock:", error)
      toast.dismiss(loadingToast)
      toast.error("Failed to submit restock request. Please try again.", {
        duration: 4000
      })
    } finally {
      setIsRestocking(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p>Loading product data...</p>
        </div>
      </div>
    )
  }

  if (!productDetails) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <p className="mt-2">The requested product could not be found in our database.</p>
      </div>
    )
  }

  const stockDurationEstimate = estimateStockDuration()

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      {/* React Hot Toast container */}
      <Toaster position="top-right" />

      <h1 className="text-3xl font-bold mb-8">Product History: {productDetails.productName}</h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Package className="mr-2 h-4 w-4" />
                <span>Category: {productDetails.category}</span>
              </div>
              <div className="flex items-center">
                <Package className="mr-2 h-4 w-4" />
                <span>Total Quantity: {productDetails.quantity}</span>
              </div>
              <div className="flex items-center">
                <Badge
                  variant={
                    productDetails.status === "Available"
                      ? "default"
                      : productDetails.status === "Low Stock"
                        ? "warning"
                        : "destructive"
                  }
                >
                  {productDetails.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Product Usage History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Quantity Used</TableHead>  
                  <TableHead>Remaining After Event</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageHistory.length > 0 ? (
                  usageHistory.map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell className="font-medium">{usage.event}</TableCell>
                      <TableCell>{new Date(usage.date).toLocaleDateString()}</TableCell>
                      <TableCell>{usage.used}</TableCell>
                      <TableCell>{usage.remaining}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">No usage history found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Stock Consumption Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stockTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="stock" stroke="#8884d8" name="Stock Level" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold">Usage Predictions:</h3>
              <p>Based on current trends, stock is estimated to last for {stockDurationEstimate}.</p>
            </div>
            {productDetails.monthsUntilExpiry !== null && productDetails.monthsUntilExpiry <= 3 && (
              <div className="mt-4">
                <Badge variant="warning" className="flex items-center w-fit">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Expiry Warning: Product will expire in {productDetails.monthsUntilExpiry} {productDetails.monthsUntilExpiry === 1 ? 'month' : 'months'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Monthly Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalUsed" fill="#8884d8" name="Units Used" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Yearly Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalUsed" fill="#82ca9d" name="Total Units Used" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex justify-end space-x-4"
      >
        {/* {productDetails && (
          <PDFDownloadLink 
            document={<ProductPDFReport productDetails={productDetails} usageHistory={usageHistory} />} 
            fileName={`${productDetails.productName}-report.pdf`}
          >
            {({ loading }) => (
              <Button className="bg-[#1CAC78] hover:bg-[#158f63]" disabled={loading}>
                <FileText className="mr-2 h-4 w-4" />
                {loading ? "Generating PDF..." : "Generate PDF Report"}
              </Button>
            )}
          </PDFDownloadLink>
        )} */}
        <Button 
          variant="outline"
          onClick={handleRestockRequest}
          disabled={isRestocking}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRestocking ? 'animate-spin' : ''}`} />
          {isRestocking ? "Requesting..." : "Request Restock"}
        </Button>
      </motion.div>
    </motion.div>
  )
}