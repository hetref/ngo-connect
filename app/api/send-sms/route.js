// const twilio = require('twilio');
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN; // Your Auth Token
const client = twilio(accountSid, authToken);

export async function POST(req) {
  try {
    const { to, body } = await req.json();
    console.log("TO", to);
    console.log("BODY", body);

    const message = await client.messages.create({
      to: `+91${to}`,
      from: "+12344145236",
      body,
    });
    console.log("MESSAGE", message);

    return Response.json({ success: true, messageSid: message.sid });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
