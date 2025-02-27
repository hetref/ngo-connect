import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import React from "react";

const NotificationInformation = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification & Communication Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch id="email-alerts" className="border-gray-300" />
          <Label htmlFor="email-alerts">
            Receive email alerts for new donations
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="sms-alerts" className="border-gray-300" />
          <Label htmlFor="sms-alerts">
            Receive SMS alerts for new volunteers
          </Label>
        </div>
        <div className="space-y-2">
          <Label>Custom Thank You Messages</Label>
          <Textarea
            placeholder="Enter your custom thank you message for donors"
            className="border-gray-300"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="automated-reports" className="border-gray-300" />
          <Label htmlFor="automated-reports">
            Send automated monthly reports
          </Label>
        </div>
        <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">
          Save Notification Preferences
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationInformation;
