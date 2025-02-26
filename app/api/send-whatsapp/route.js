import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, ngoName, date, email, phone, amount } = await request.json();

    const response = await fetch(
      "https://graph.facebook.com/v21.0/592543543932338/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer EAANrkthXHSQBOZCzfZA2B1cZABumqNOhLOEGsu6WNR66dvTxRZCS93G5rOACYWiGJSq5NitNpZCGw3z6AekPKWZCeQyflVSa242yZB9D2lnd4sqcrCBPHr90KbAC4KCh86g5O30FKiFJRMCvm90bEg5ZCQaiGpLMOYBCygeto5rKno6PNqsWppZB1x4uns4ZAqlTkrxrXSKu2e9XzLtvLbwpN1RxBEshWqNQVULqYI3kjx",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: "user_donations_details",
            language: { code: "en_US" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: name },
                  { type: "text", text: ngoName },
                  { type: "text", text: date },
                  { type: "text", text: email },
                  { type: "text", text: phone },
                  { type: "text", text: `${amount}` },
                ],
              },
            ],
          },
        }),
      }
    );

    const data = await response.json();
    console.log("RESPONSE", response)
    console.log("RESPONSE", data)
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}