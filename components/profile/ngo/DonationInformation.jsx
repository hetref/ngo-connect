import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, CreditCard } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; // Import Firestore
import { doc, updateDoc, onSnapshot } from "firebase/firestore"; // Import updateDoc and onSnapshot functions
import toast from "react-hot-toast";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from "wagmi";
import { useWriteContract, useReadContract } from "wagmi";
import { SuperAdminABI } from "@/constants/contract";

const DonationInformation = ({ ngoId, approvalStatus, verificationStatus }) => {
  const { data: hash, isPending, writeContract } = useWriteContract();
  const { address: walletAddress, isConnected } = useAccount();

  const {
    data: ngoOwnerAddContract,
    error: ngoOwnerError,
    isPending: ngoOwnerAddPending,
  } = useReadContract({
    address: "0x0d6520f87a7c18bf10972a4E47F99338DE64B2B8",
    abi: SuperAdminABI,
    functionName: "ngoContracts",
    args: [walletAddress],
  });

  // Convert zero address to null
  const formattedNgoOwnerContract =
    ngoOwnerAddContract === "0x0000000000000000000000000000000000000000"
      ? null
      : ngoOwnerAddContract;

  console.log("NGO OWNER ADDRESS", ngoOwnerAddContract);

  const [donationsData, setDonationsData] = useState({
    razorpayKeyId: "",
    razorpayKeySecret: "",
    isBankTransferEnabled: false,
    isCryptoTransferEnabled: false,
    cryptoWalletAddress: walletAddress,
    bankTransferDetails: {
      accountHolderName: "",
      bankName: "",
      branchNameAddress: "",
      accountNumber: "",
      accountType: "",
      ifscCode: "",
    },
    acknowledgmentMessage: "",
  });

  // Contract Address SuperAdmin - 0x0d6520f87a7c18bf10972a4E47F99338DE64B2B8

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "ngo", ngoId), (doc) => {
      if (doc.exists() && doc.data()?.donationsData) {
        setDonationsData(doc.data().donationsData);
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [ngoId]);

  useEffect(() => {
    if (!isConnected) {
      setDonationsData((prev) => ({
        ...prev,
        cryptoWalletAddress: "",
      }));
    } else {
      setDonationsData((prev) => ({
        ...prev,
        cryptoWalletAddress: walletAddress,
      }));
    }
  }, [walletAddress, isConnected]);

  const addNgoInContract = async () => {
    try {
      await writeContract({
        address: "0x0d6520f87a7c18bf10972a4E47F99338DE64B2B8",
        abi: SuperAdminABI,
        functionName: "createNGO",
        args: [walletAddress, "0xAbFb2AeF4aAC335Cda2CeD2ddd8A6521047e8ddF"],
      });
    } catch (error) {
      console.error("Error creating NGO contract:", error);
      toast.error("Failed to create NGO contract");
    }
  };

  const handleSave = async () => {
    if (!donationsData.razorpayKeyId || !donationsData.razorpayKeySecret) {
      toast.error("Razorpay Key ID and Secret are required.");
      return;
    }

    if (
      donationsData.isBankTransferEnabled &&
      (donationsData.bankTransferDetails.accountHolderName === "" ||
        donationsData.bankTransferDetails.bankName === "" ||
        donationsData.bankTransferDetails.branchNameAddress === "" ||
        donationsData.bankTransferDetails.accountNumber === "" ||
        donationsData.bankTransferDetails.accountType === "" ||
        donationsData.bankTransferDetails.ifscCode === "")
    ) {
      toast.error("All bank transfer details are required.");
      return;
    }

    if (donationsData.isCryptoTransferEnabled && !isConnected) {
      toast.error("Crypto wallet address is required.");
      return;
    }

    console.log("DONATIONDATA", donationsData);

    if (!donationsData.isCryptoTransferEnabled) {
      donationsData.cryptoWalletAddress = null;
    }

    try {
      // Check if contract address is zero/null and create NGO if needed
      if (!formattedNgoOwnerContract) {
        await addNgoInContract();
        // Wait for transaction to be mined before proceeding
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Add delay to allow contract creation
      }

      // Update the donations data with wallet and contract addresses
      const updatedDonationsData = {
        ...donationsData,
        ngoOwnerAdd: walletAddress,
        ngoOwnerAddContract: formattedNgoOwnerContract,
      };

      await updateDoc(doc(db, "ngo", ngoId), {
        donationsData: updatedDonationsData,
      });

      toast.success("Donation settings updated successfully!");
    } catch (error) {
      console.error("Error updating donation settings: ", error);
      toast.error("Failed to update donation settings.");
    }
  };

  const handleChange = (e, key) => {
    setDonationsData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleBankTransferChange = (e, key) => {
    setDonationsData((prev) => ({
      ...prev,
      bankTransferDetails: {
        ...prev.bankTransferDetails,
        [key]: e.target.value,
      },
    }));
  };

  const toggleBankTransfer = () => {
    setDonationsData((prev) => ({
      ...prev,
      isBankTransferEnabled: !prev.isBankTransferEnabled,
    }));
  };

  const toggleCryptoTransfer = () => {
    setDonationsData((prev) => ({
      ...prev,
      isCryptoTransferEnabled: !prev.isCryptoTransferEnabled,
    }));
  };

  // NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_9xch4WbEcXUxCT
  // RAZORPAY_KEY_SECRET=LpFjSLwn631qJf7fZwNvNuKB

  const shouldDisableInputs =
    (verificationStatus === "verified" && approvalStatus === "verified") ||
    (verificationStatus === "pending" && approvalStatus === "pending");

  const pendingTitle =
    "You cannot update the profile while the verification is in progress";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Donation & Payout Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Razorpay Credentials</Label>
          <Input
            placeholder="Razorpay Key ID"
            value={donationsData.razorpayKeyId}
            onChange={(e) => handleChange(e, "razorpayKeyId")}
            className="border-gray-300"
            required
            disabled={shouldDisableInputs}
            title={shouldDisableInputs ? pendingTitle : ""}
          />
          <Input
            placeholder="Razorpay Key Secret"
            value={donationsData.razorpayKeySecret}
            onChange={(e) => handleChange(e, "razorpayKeySecret")}
            className="border-gray-300"
            required
            disabled={shouldDisableInputs}
            title={shouldDisableInputs ? pendingTitle : ""}
          />
        </div>
        <div className="space-y-2">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <Label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={donationsData.isBankTransferEnabled}
                onChange={toggleBankTransfer}
                className="mr-2"
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
              />
              Enable Bank Transfers
            </Label>
          </div>
          {donationsData.isBankTransferEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-4">
              <Input
                placeholder="Account Holder Name"
                value={donationsData.bankTransferDetails.accountHolderName}
                onChange={(e) =>
                  handleBankTransferChange(e, "accountHolderName")
                }
                className="border-gray-300"
                required
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
              />
              <Input
                placeholder="Bank Name"
                value={donationsData.bankTransferDetails.bankName}
                onChange={(e) => handleBankTransferChange(e, "bankName")}
                className="border-gray-300"
                required
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
              />
              <Input
                placeholder="Branch Name & Address"
                value={donationsData.bankTransferDetails.branchNameAddress}
                onChange={(e) =>
                  handleBankTransferChange(e, "branchNameAddress")
                }
                className="border-gray-300"
                required
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
              />
              <Input
                placeholder="Account Number"
                value={donationsData.bankTransferDetails.accountNumber}
                onChange={(e) => handleBankTransferChange(e, "accountNumber")}
                className="border-gray-300"
                required
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
              />
              <Input
                placeholder="Account Type (Savings/Current)"
                value={donationsData.bankTransferDetails.accountType}
                onChange={(e) => handleBankTransferChange(e, "accountType")}
                className="border-gray-300"
                required
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
              />
              <Input
                placeholder="IFSC Code"
                value={donationsData.bankTransferDetails.ifscCode}
                onChange={(e) => handleBankTransferChange(e, "ifscCode")}
                className="border-gray-300"
                required
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <Label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={donationsData.isCryptoTransferEnabled}
                onChange={toggleCryptoTransfer}
                className="mr-2"
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
              />
              Enable Crypto Transfers
            </Label>
          </div>
          {donationsData.isCryptoTransferEnabled && (
            <div className="w-full flex items-center gap-4">
              {!shouldDisableInputs && isConnected && (
                <Input
                  placeholder="Crypto Wallet Address"
                  value={donationsData.cryptoWalletAddress || walletAddress}
                  onChange={(e) => handleChange(e, "cryptoWalletAddress")}
                  className="border-gray-300 w-fit"
                  required
                  readOnly
                  disabled={shouldDisableInputs}
                  title={shouldDisableInputs ? pendingTitle : ""}
                />
              )}

              {(isConnected || !formattedNgoOwnerContract) && (
                <div className="w-fit flex items-center justify-center">
                  <ConnectButton />
                </div>
              )}

              {isConnected && formattedNgoOwnerContract && (
                <div className="w-fit flex items-center justify-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    Contract Address: {formattedNgoOwnerContract}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Donation Acknowledgment Message</Label>
          <Textarea
            placeholder="Enter your custom thank you message for donors"
            value={donationsData.acknowledgmentMessage}
            onChange={(e) => handleChange(e, "acknowledgmentMessage")}
            className="border-gray-300"
            disabled={shouldDisableInputs}
            title={shouldDisableInputs ? pendingTitle : ""}
          />
        </div>
        <Button
          className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]"
          onClick={handleSave}
          disabled={shouldDisableInputs}
          title={shouldDisableInputs ? pendingTitle : ""}
        >
          Save Donation Settings
        </Button>
        {isPending && <span>Pending Transaction</span>}
        {hash && <div>Transaction Hash: {hash}</div>}
      </CardContent>
    </Card>
  );
};

export default DonationInformation;
