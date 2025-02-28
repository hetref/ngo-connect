export const sendWhatsappMessage = async (
  name,
  ngoName,
  date,
  email,
  phone,
  amount
) => {
  const response = await fetch("/api/send-whatsapp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      ngoName,
      date,
      email,
      phone,
      amount,
    }),
  });

  return response;
};

