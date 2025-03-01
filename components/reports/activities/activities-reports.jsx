import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
// import { PDFDownloadLink } from "@react-pdf/renderer";
import ActivityReportPDF from "./activity-report-pdf";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Skeleton } from "@/components/ui/skeleton"

export default function ActivitiesReports({ timeFrame }) {
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activityData, setActivityData] = useState({
    total: 0,
    breakdown: [],
    volunteers: 0,
    participants: 0,
    categoryDistribution: [],
  });
  const [ngoId, setNgoId] = useState(null);
  const [ngoCategories, setNgoCategories] = useState([]);
  const [ngoInfo, setNgoInfo] = useState({
    name: "",
    address: "",
    email: "",
  });

  // Prepare report data for PDF export
  const reportData = {
    timeFrame: getTimeFrameLabel(timeFrame),
    ngoInfo: ngoInfo,
    activities: {
      total: activityData.total,
      volunteers: activityData.volunteers,
      participants: activityData.participants,
      breakdown: activityData.breakdown,
      timeFrame: timeFrame,
    },
    date: new Date().toLocaleDateString(),
  };

  // Helper function to get readable time frame label
  function getTimeFrameLabel(timeFrame) {
    switch (timeFrame) {
      case "1month":
        return "Last Month";
      case "3months":
        return "Last 3 Months";
      case "1year":
        return "Last Year";
      default:
        return "Last Month";
    }
  }

  // Fetch NGO ID, categories, and info once on component mount
  useEffect(() => {
    const fetchNgoInfo = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get NGO ID from user document
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) return;

        const userNgoId = userDoc.data().ngoId;
        setNgoId(userNgoId);

        // Get NGO categories and basic info
        const ngoDoc = await getDoc(doc(db, "ngo", userNgoId));
        if (ngoDoc.exists()) {
          const ngoData = ngoDoc.data();
          setNgoCategories(ngoData.categories || []);
          setNgoInfo({
            name: ngoData.ngoName || "Your NGO",
            address: ngoData.address || "NGO Address",
            email: ngoData.email || user.email || "NGO Email",
          });
        }
      } catch (error) {
        console.error("Error fetching NGO info:", error);
      }
    };

    fetchNgoInfo();
  }, []);

  // Process activities data
  const processActivitiesData = (activitiesSnapshot, timeLimit) => {
    let totalActivities = 0;
    let totalVolunteers = 0;
    let totalParticipants = 0;
    const categoryCount = {};

    // Initialize category counts
    ngoCategories.forEach((category) => {
      categoryCount[category] = 0;
    });

    const filteredActivities = [];

    activitiesSnapshot.forEach((activityDoc) => {
      try {
        const activity = activityDoc.data();

        // Extract eventDate directly
        const eventDate = activity.eventDate;
        if (!eventDate) return; // Skip if no event date

        // Parse the event date to get timestamp
        let activityTimestamp;
        try {
          activityTimestamp = new Date(eventDate).getTime();
        } catch (err) {
          console.log("Error parsing date for activity:", activityDoc.id);
          return; // Skip this activity if date parsing fails
        }

        // Filter by time frame
        if (activityTimestamp >= timeLimit) {
          totalActivities++;
          totalVolunteers += parseInt(activity.noOfVolunteers || 0);
          totalParticipants += parseInt(activity.noOfParticipants || 0);

          // Count by category
          const category = activity.category;
          if (category && categoryCount.hasOwnProperty(category)) {
            categoryCount[category]++;
          }

          filteredActivities.push(activity);
        }
      } catch (err) {
        console.log("Error processing activity:", activityDoc.id, err);
      }
    });

    // Prepare category breakdown for display
    const categoryBreakdown = Object.keys(categoryCount).map((category) => ({
      category,
      count: categoryCount[category],
      volunteers: 0,
      participants: 0,
    }));

    // Calculate volunteers and participants per category
    filteredActivities.forEach((activity) => {
      try {
        const category = activity.category;
        if (category) {
          const categoryIndex = categoryBreakdown.findIndex(
            (item) => item.category === category
          );
          if (categoryIndex !== -1) {
            categoryBreakdown[categoryIndex].volunteers += parseInt(
              activity.noOfVolunteers || 0
            );
            categoryBreakdown[categoryIndex].participants += parseInt(
              activity.noOfParticipants || 0
            );
          }
        }
      } catch (err) {
        console.log("Error processing category data:", err);
      }
    });

    // Sort categories by count for chart display
    const topCategories = [...categoryBreakdown]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      total: totalActivities,
      breakdown: categoryBreakdown,
      volunteers: totalVolunteers,
      participants: totalParticipants,
      categoryDistribution: topCategories,
    };
  };

  // Set up realtime listener for activities when ngoId and timeFrame change
  useEffect(() => {
    if (!ngoId || ngoCategories.length === 0) return;

    setLoading(true);

    // Calculate time frame filter
    const now = new Date();
    let timeLimit;

    switch (timeFrame) {
      case "1month":
        timeLimit = new Date(now.setMonth(now.getMonth() - 1)).getTime();
        break;
      case "3months":
        timeLimit = new Date(now.setMonth(now.getMonth() - 3)).getTime();
        break;
      case "1year":
        timeLimit = new Date(now.setFullYear(now.getFullYear() - 1)).getTime();
        break;
      default:
        timeLimit = new Date(now.setMonth(now.getMonth() - 1)).getTime();
    }

    // Query activities by NGO ID
    const activitiesQuery = query(
      collection(db, "activities"),
      where("ngoId", "==", ngoId)
    );

    // Set up realtime listener
    const unsubscribe = onSnapshot(
      activitiesQuery,
      (activitiesSnapshot) => {
        try {
          const processedData = processActivitiesData(
            activitiesSnapshot,
            timeLimit
          );
          setActivityData(processedData);
        } catch (error) {
          console.error("Error processing activities data:", error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Realtime activities listener error:", error);
        setLoading(false);
      }
    );

    // Clean up listener on unmount or when dependencies change
    return () => unsubscribe();
  }, [ngoId, ngoCategories, timeFrame]);

  // Handle PDF export
  const handleExportPDF = () => {
    setIsExporting(true);
    // We'll use the PDFDownloadLink's automatic download functionality
    // This function is just a placeholder for any additional actions
    setTimeout(() => {
      setIsExporting(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>Activities Overview</div>
              <Skeleton className="h-10 w-[120px]" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </div>
              <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <Skeleton className="h-[300px] w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle empty data
  if (activityData.total === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>Activities Overview</div>
              <Button disabled={true}>
                <FileText className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-xl">
                No activities found for the selected time period.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>Activities Overview</div>
            <PDFDownloadLink
              document={<ActivityReportPDF reportData={reportData} />}
              fileName={`Activities_Report_${timeFrame}_${new Date().toISOString().split("T")[0]}.pdf`}
            >
              {({ blob, url, loading, error }) => (
                <Button
                  onClick={handleExportPDF}
                  disabled={loading || isExporting}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {loading || isExporting ? "Generating..." : "Export PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-4">
            Total Activities: {activityData.total}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Activity Breakdown</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Volunteers</TableHead>
                    <TableHead>Participants</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityData.breakdown.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>{item.volunteers}</TableCell>
                      <TableCell>{item.participants}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Top 3 Categories</h3>
              <div className="h-[300px]">
                {activityData.categoryDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData.categoryDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Activities" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p>No categories to display</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Engagement Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Volunteer Participation
              </h3>
              <p className="text-2xl font-bold">
                {activityData.volunteers} Volunteers
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Total Participants</h3>
              <p className="text-2xl font-bold">
                {activityData.participants} Participants
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}