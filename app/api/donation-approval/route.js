import { Resend } from "resend";
import { NextResponse } from "next/server";
import { CashDonationApproval } from "@/components/email/CashDonationApproval";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const {
    donorEmail,
    donorName,
    donorPhone,
    amount,
    donationApprovalId,
    ngoName,
    donatedOn,
    wantsCertificate,
    donationApprovalLink
  } = await request.json();
  console.log(
    donorEmail,
    donorName,
    donorPhone,
    amount,
    donationApprovalId,
    donatedOn,
    wantsCertificate,
    ngoName,
    donationApprovalLink,
  );
  try {
    const { error } = await resend.emails.send({
      from: "NGO Connect <contact@aryanshinde.in>",
      to: donorEmail,
      subject: "Cash Donation Approval",
      react: CashDonationApproval({
        donorEmail,
        donorName,
        donorPhone,
        amount,
        donationApprovalId,
        ngoName,
        donatedOn,
        wantsCertificate,
        donationApprovalLink,
      }),
    });

    if (error) {
      console.log("ERROR", error);
      return NextResponse.json({ error, status: 500 });
    }

    console.log("SUCCESS", donorEmail);
    return NextResponse.json({ status: 200 });
  } catch (error) {
    console.log("ERROR", error);
    return NextResponse.json({ error, status: 500 });
  }
}
