"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge, Upload } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

const VerificationInformation = ({
  ngoId,
  approvalStatus,
  verificationStatus,
}) => {
  const [documents, setDocuments] = useState({});
  const [files, setFiles] = useState({});
  const [status, setStatus] = useState("");

  const RequiredLabel = ({ children }) => (
    <Label className="flex items-center gap-1">
      <span className="text-red-500">*</span>
      {children}
    </Label>
  );

  const documentTypes = [
    { name: "Registration Certificate", required: true },
    { name: "PAN Card of NGO", required: true },
    { name: "Trust Deed or MOA", required: true },
    { name: "Director or Trustee Aadhaar & PAN", required: true },
    { name: "12A Certificate", required: false },
    { name: "80G Certificate", required: false },
    { name: "FCRA Certificate", required: false },
    { name: "GST Certificate", required: false },
    { name: "Annual Reports & Financials", required: false },
  ];

  useEffect(() => {
    const fetchDocuments = async () => {
      const docRef = doc(db, "ngo", ngoId);
      const docSnap = await getDoc(docRef);
      console.log("FETCHING");

      if (docSnap.exists()) {
        setDocuments(docSnap.data().verificationDocuments || {});
        setStatus(docSnap.data().governmentRecognitionStatus || "");
        console.log("Documents:", docSnap.data().verificationDocuments);
        console.log("Status:", docSnap.data().governmentRecognitionStatus);
      }
    };

    fetchDocuments();
  }, [ngoId]);

  const handleFileChange = (type, file) => {
    setFiles((prev) => ({ ...prev, [type]: file }));
  };

  const handleUpload = async () => {
    const docRef = doc(db, "ngo", ngoId);
    const newDocuments = { ...documents };

    for (const [type, file] of Object.entries(files)) {
      const storageRef = ref(storage, `ngo/${ngoId}/documents/${type}`);
      console.log("Uploading file:", type, file);
      await uploadBytes(storageRef, file);
      console.log("UPLOADED: ", type);
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Download URL:", downloadURL);
      newDocuments[type] = downloadURL;
    }
    console.log("UPDATING DOCUMENT");
    await updateDoc(docRef, {
      verificationDocuments: newDocuments,
      governmentRecognitionStatus: status,
    });
    console.log("UPDATED DOCUMENT");

    setDocuments(newDocuments);
    setFiles({});
  };

  const isAllRequiredDocumentsUploaded = () => {
    return (
      documentTypes.every(
        (type) => !type.required || files[type.name] || documents[type.name]
      ) && status !== ""
    );
  };

  const shouldDisableInputs =
    (verificationStatus === "verified" && approvalStatus === "verified") ||
    (verificationStatus === "pending" && approvalStatus === "pending");

  const pendingTitle =
    "You cannot update the profile while the verification is in progress";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification & Compliance</CardTitle>
        <div className="text-sm text-gray-500 mt-2">
          <span className="text-red-500">*</span> Required fields
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {documentTypes.map((type) => (
            <div key={type.name} className="space-y-2">
              {type.required ? (
                <RequiredLabel>{type.name}</RequiredLabel>
              ) : (
                <Label>{type.name}</Label>
              )}
              <div className="flex items-center space-x-2">
                {documents[type.name] ? (
                  <>
                    <Button
                      onClick={() =>
                        window.open(documents[type.name], "_blank")
                      }
                    >
                      View
                    </Button>
                    <Input
                      type="file"
                      className="border-gray-300"
                      accept=".pdf"
                      onChange={(e) =>
                        handleFileChange(type.name, e.target.files[0])
                      }
                      disabled={shouldDisableInputs}
                      title={shouldDisableInputs ? pendingTitle : ""}
                    />
                  </>
                ) : (
                  <Input
                    type="file"
                    className="border-gray-300"
                    accept=".pdf"
                    onChange={(e) =>
                      handleFileChange(type.name, e.target.files[0])
                    }
                    disabled={shouldDisableInputs}
                    title={shouldDisableInputs ? pendingTitle : ""}
                  />
                )}
              </div>
            </div>
          ))}
          <div className="space-y-2">
            <RequiredLabel>Government Recognition Status</RequiredLabel>
            <Select
              className="border-gray-300"
              value={status}
              onValueChange={setStatus}
              required
              disabled={shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recognized">Recognized</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="not-applied">Not Applied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]"
          onClick={handleUpload}
          disabled={!isAllRequiredDocumentsUploaded() || shouldDisableInputs}
          title={shouldDisableInputs ? pendingTitle : ""}
        >
          Update Verification Documents
        </Button>
      </CardContent>
    </Card>
  );
};

export default VerificationInformation;
