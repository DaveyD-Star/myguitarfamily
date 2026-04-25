exports.handler = async function (event) {
  try {
    const stripeEvent = JSON.parse(event.body);

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;

      const orderDetails = {
        stripeSessionId: session.id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email || session.customer_email,
        customerName: session.customer_details?.name,
        amountTotal: session.amount_total,
        currency: session.currency,
      };

      console.log("ORDER PAID:", JSON.stringify(orderDetails, null, 2));

      // 👇 SEND EMAIL
      await fetch("https://api.netlify.com/api/v1/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "myguitarfamily@gmail.com",
          subject: "New Order - MyGuitarFamily",
          text: JSON.stringify(orderDetails, null, 2),
        }),
      });
    }

    return {
      statusCode: 200,
      body: "Webhook processed",
    };
  } catch (err) {
    console.error("Webhook error:", err);

    return {
      statusCode: 500,
      body: err.message,
    };
  }
};