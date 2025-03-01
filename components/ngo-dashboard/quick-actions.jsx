import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserCheck, DollarSign, Award } from "lucide-react";
import Link from "next/link";

const actions = [
  {
    label: "Create Event",
    icon: PlusCircle,
    href: "/dashboard/ngo/activities/new",
  },
  { label: "Add Members", icon: UserCheck, href: "/dashboard/ngo/members" },
  {
    label: "View our Donations",
    icon: DollarSign,
    href: "/dashboard/ngo/donations/",
  },
  { label: "View Reports", icon: Award, href: "/dashboard/ngo/reports" },
];

export function QuickActions() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {actions.map((action, index) => (
          <Link
            key={index}
            variant="outline"
            className="w-full justify-start border-black/40  transition-colors duration-200 flex items-center gap-2 rounded-lg border-2 p-1"
            href={action.href}
          >
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
