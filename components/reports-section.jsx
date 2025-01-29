import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, BarChart } from "lucide-react"

export function ReportsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full justify-start" variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Generate AI-Powered Report
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <BarChart className="mr-2 h-4 w-4" />
          View Event Analytics
        </Button>
      </CardContent>
    </Card>
  )
}

