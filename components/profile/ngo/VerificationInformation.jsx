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

const VerificationInformation = ({ ngoId }) => {
  const [documents, setDocuments] = useState({});
  const [files, setFiles] = useState({});
  const [status, setStatus] = useState("");

  const documentTypes = [
    { name: "Registration Certificate", required: true },
    { name: "12A Certificate", required: true },
    { name: "80G Certificate", required: true },
    { name: "PAN Card of NGO", required: true },
    { name: "Trust Deed / MOA", required: true },
    { name: "Director/Trustee Aadhaar & PAN", required: true },
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification & Compliance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {documentTypes.map((type) => (
          <div key={type.name} className="space-y-2">
            <Label>{type.name}</Label>
            <div className="flex items-center space-x-2">
              {documents[type.name] ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => window.open(documents[type.name], "_blank")}
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
                />
              )}
            </div>
          </div>
        ))}
        <div className="space-y-2">
          <Label>Government Recognition Status</Label>
          <Select
            className="border-gray-300"
            value={status}
            onValueChange={setStatus}
            required
          >
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
        <Button
          className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]"
          onClick={handleUpload}
          disabled={!isAllRequiredDocumentsUploaded()}
        >
          Update Verification Documents
        </Button>
      </CardContent>
    </Card>
  );
};

export default VerificationInformation;
