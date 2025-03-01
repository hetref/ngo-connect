import { Resend } from "resend";
import { NextResponse } from "next/server";
import { ResourceDonationApproval } from "@/components/email/ResourceDonationApproval";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const {
    donorEmail,
    donorName,
    donorPhone,
    resource,
    quantity,
    donationApprovalId,
    ngoName,
    donatedOn,
    donationApprovalLink
  } = await request.json();

  try {
    const { error } = await resend.emails.send({
      from: "NGO Connect <contact@aryanshinde.in>",
      to: donorEmail,
      subject: "Resource Donation Approval",
      react: ResourceDonationApproval({
        donorName,
        donorEmail,
        donorPhone,
        resource,
        quantity,
        ngoName,
        donatedOn,
        donationApprovalLink,
        donationApprovalId
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
