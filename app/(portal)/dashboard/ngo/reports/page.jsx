"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText, Mail, Clock } from "lucide-react";
import DonationReports from "@/components/reports/donation-reports";
import ActivitiesReports from "@/components/reports/activities-reports";
import MemberReports from "@/components/reports/member-reports";
import GraphGenerator from "@/components/reports/graph-generator";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PDFTemplate from "@/components/reports/pdf-template";

export default function NGOReportsPage() {
  const [timeFrame, setTimeFrame] = useState("1month");
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState({
    timeFrame: "1month",
    donations: {
      total: 150000,
      breakdown: [
        { method: "Cash", amount: 50000 },
        { method: "UPI", amount: 60000 },
        { method: "Bank Transfer", amount: 30000 },
        { method: "Cryptocurrency", amount: 10000 },
      ],
    },
    activities: {
      total: 25,
      volunteers: 150,
      fundsSpent: 75000,
    },
    members: {
      totalMembers: 500,
      newMembers: 50,
    },
  });

  const handleExportPDF = () => {
    setIsExporting(true);
    // The actual download will be handled by PDFDownloadLink
  };

  const handleShareReport = () => {
    // Placeholder for report sharing functionality
    console.log("Sharing report...");
  };

  const handleScheduleReport = () => {
    // Placeholder for report scheduling functionality
    console.log("Scheduling report...");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-3xl font-bold mb-8">NGO Reports & Analytics</h1>

      <div className="flex justify-between items-center mb-6">
        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time frame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">1 Month</SelectItem>
            <SelectItem value="3months">3 Months</SelectItem>
            <SelectItem value="1year">1 Year</SelectItem>
          </SelectContent>
        </Select>
        <div className="space-x-2">
          <PDFDownloadLink
            document={<PDFTemplate reportData={reportData} />}
            fileName={`NGO_Report_${timeFrame}.pdf`}
          >
            {({ blob, url, loading, error }) => (
              <Button
                onClick={handleExportPDF}
                disabled={loading || isExporting}
              >
                <FileText className="mr-2 h-4 w-4" />
                {loading ? "Generating..." : "Export PDF"}
              </Button>
            )}
          </PDFDownloadLink>
          <Button onClick={handleShareReport}>
            <Mail className="mr-2 h-4 w-4" /> Share Report
          </Button>
          <Button onClick={handleScheduleReport}>
            <Clock className="mr-2 h-4 w-4" /> Schedule Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="donations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="graphs">Graph Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="donations">
          <DonationReports timeFrame={timeFrame} />
        </TabsContent>

        <TabsContent value="activities">
          <ActivitiesReports timeFrame={timeFrame} />
        </TabsContent>

        <TabsContent value="members">
          <MemberReports timeFrame={timeFrame} />
        </TabsContent>

        <TabsContent value="graphs">
          <GraphGenerator timeFrame={timeFrame} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
