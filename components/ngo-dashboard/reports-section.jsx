import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BarChart } from "lucide-react";
import { useRouter } from "next/navigation";

export function ReportsSection() {
  const router = useRouter();
  const redirectToReports = () => {
    // Redirect to the reports page
    router.push("/dashboard/ngo/reports");
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={redirectToReports}
        >
          <BarChart className="mr-2 h-4 w-4" />
          View Activities Analytics
        </Button>
      </CardContent>
    </Card>
  );
}
