import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import React from "react";

const DonationInformation = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Donation & Payout Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Bank Account Details</Label>
          <Input placeholder="Account Number" className="border-gray-300" />
          <Input placeholder="IFSC Code" className="border-gray-300" />
          <Input
            placeholder="Account Holder Name"
            className="border-gray-300"
          />
        </div>
        <div className="space-y-2">
          <Label>Preferred Payment Methods</Label>
          <div className="flex space-x-2">
            <Button variant="outline">
              <CreditCard className="mr-2 h-4 w-4" /> UPI
            </Button>
            <Button variant="outline">
              <CreditCard className="mr-2 h-4 w-4" /> Bank Transfer
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Donation Acknowledgment Message</Label>
          <Textarea
            placeholder="Enter your custom thank you message for donors"
            className="border-gray-300"
          />
        </div>
        <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">
          Save Donation Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default DonationInformation;
