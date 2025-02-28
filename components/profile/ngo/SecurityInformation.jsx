import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Lock } from "lucide-react";
import React from "react";

const SecurityInformation = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security & Privacy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <Input
            id="current-password"
            type="password"
            className="border-gray-300"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            className="border-gray-300"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input
            id="confirm-password"
            type="password"
            className="border-gray-300"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="two-factor-auth" className="border-gray-300" />
          <Label htmlFor="two-factor-auth">
            Enable Two-Factor Authentication (2FA)
          </Label>
        </div>
        <div className="space-y-2">
          <Label>Data Access Logs</Label>
          <Button variant="outline">
            <Lock className="mr-2 h-4 w-4" /> View Access Logs
          </Button>
        </div>
        <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">
          Update Security Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default SecurityInformation;
