"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge, Upload } from "lucide-react";
import React from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const VerificationInformation = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification & Compliance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>NGO Registration Certificate</Label>
          <div className="flex items-center space-x-2">
            <Input type="file" className="border-gray-300" />
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Government Recognition Status</Label>
          <Select className="border-gray-300">
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recognized">Recognized</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="not-applicable">Not Applicable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tax Exemption Certificate</Label>
          <div className="flex items-center space-x-2">
            <Input type="file" className="border-gray-300" />
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">Verified</Badge>
          <span className="text-sm text-muted-foreground">
            Your NGO is verified
          </span>
        </div>
        <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">
          Update Verification Documents
        </Button>
      </CardContent>
    </Card>
  );
};

export default VerificationInformation;
