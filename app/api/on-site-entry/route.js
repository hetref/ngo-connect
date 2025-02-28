import { Resend } from "resend";
import { NextResponse } from "next/server";
import { MemberInvitation } from "@/components/email/MemberInvitation";
import { OnSiteEntry } from "@/components/email/OnSiteEntry";
// import { MemberInvitation } from "@/components/email/MemberInvitation";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const { type, ngoId, email, ngoName } = await request.json();
  try {
    const { error } = await resend.emails.send({
      from: "NGO Connect <contact@aryanshinde.in>",
      to: [email],
      subject: "Member Invitation",
      react: OnSiteEntry({
        type,
        ngoId,
        email,
        ngoName,
        eventName,
      }), // <-- Closing parenthesis added here
    });

    if (error) {
      console.log("ERROR", error);
      return NextResponse.json({ error, status: 500 });
    }

    console.log("SUCCESS", email);
    return NextResponse.json({ status: 200 });
  } catch (error) {
    console.log("ERROR", error);
    return NextResponse.json({ error, status: 500 });
  }
}
