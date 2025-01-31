"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import QrScanner from "react-qr-scanner";
import { CheckCircle2 } from "lucide-react";

const UserMemberSingleActivityPageQRScanner = () => {
  const [scannedResult, setScannedResult] = useState("");
  const [scanning, setScanning] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const { toast } = useToast();

  const handleStartScan = () => {
    if (!scanning) {
      setIsScanned(false);
      setScannedResult("");
    }
    setScanning(!scanning);
  };

  const handleScan = (result) => {
    if (result) {
      // Access the raw text from the result
      const scannedData = result?.text || '';
      
      if (scannedData) {
        console.log("Scanned Data:", scannedData);
        setScannedResult(scannedData);
        setScanning(false);
        setIsScanned(true);

        toast({
          title: "QR Code Scanned Successfully!",
          description: `Scanned data: ${scannedData}`,
          variant: "success",
        });
      }
    }
  };

  const handleError = (error) => {
    console.error("QR Scanner Error:", error);
    toast({
      title: "Scanner Error",
      description: "There was an error with the QR scanner. Please try again.",
      variant: "destructive",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Button
            className={`w-full ${isScanned ? "bg-green-600 hover:bg-green-700" : ""}`}
            onClick={handleStartScan}
          >
            {isScanned ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Scan Complete</span>
              </div>
            ) : scanning ? (
              "Stop Scanning"
            ) : (
              "Start Scanning"
            )}
          </Button>

          {scanning && (
            <div className="h-64 w-full bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
              <QrScanner
                onError={handleError}
                onScan={handleScan}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                constraints={{
                  audio: false,
                  video: { facingMode: "environment" }
                }}
                className="w-full h-full"
              />
            </div>
          )}

          {!scanning && (
            <div className="h-64 w-full bg-slate-100 rounded-lg flex items-center justify-center">
              {isScanned ? (
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
                  <p className="text-green-600 font-medium">
                    QR Code Successfully Scanned!
                  </p>
                  <p className="text-sm text-gray-500">
                    Scanned Result: {scannedResult}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Camera feed will appear here</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserMemberSingleActivityPageQRScanner;
