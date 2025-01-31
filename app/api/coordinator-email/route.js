import { Resend } from "resend";
import { NextResponse } from "next/server";
import { CoordinatorInvitation } from "@/components/email/CoordinatorInvitation";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const {
    eventName,
    tagline,
    shortDescription,
    featureImageUrl,
    eventDate,
    ngoName,
    activityURL,
    email,
  } = await request.json();
  console.log(
    eventName,
    tagline,
    shortDescription,
    featureImageUrl,
    eventDate,
    ngoName,
    activityURL,
    email
  );
  try {
    const { error } = await resend.emails.send({
      from: "NGO Connect <contact@aryanshinde.in>",
      to: email,
      subject: "Coordinator Message",
      react: CoordinatorInvitation({
        eventName,
        tagline,
        shortDescription,
        featureImageUrl,
        eventDate,
        ngoName,
        activityURL,
        email,
      }),
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
