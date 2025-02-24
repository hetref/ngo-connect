import Razorpay from 'razorpay';

export async function POST(req) {
  try {
    // Extracting parameters from the request body
    const { amount, userId, ngoId, rzpKeyId, rzpKeySecret } = await req.json();

    console.log("AMOUNT", amount);
    console.log("USER ID", userId);
    console.log("NGO ID", ngoId);
    console.log("RZP KEY ID", rzpKeyId);
    console.log("RZP KEY SECRET", rzpKeySecret);

    // Create Razorpay order
    const razorpay = new Razorpay({
      key_id: rzpKeyId,
      key_secret: rzpKeySecret,
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `receipt_order_${Math.random()}`,
      notes: {
        userId,
      },
    });

    console.log("Order created:", order);
    return new Response(JSON.stringify({ orderId: order.id, amount: order.amount }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Optionally, you can export other methods if needed