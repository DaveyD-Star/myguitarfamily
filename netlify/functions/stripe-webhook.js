exports.handler = async function (event) {
  try {
    const stripeEvent = JSON.parse(event.body);

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;
      const metadata = session.metadata || {};
     let guitars = [];

      try {
        guitars = JSON.parse(metadata.guitars || "[]");
      } catch (e) {
        console.error("Could not parse guitar metadata:", metadata.guitars);
        guitars = [];
      }

      const guitarListHtml = guitars.length
        ? guitars.map((g, i) => `
            <li>
              ${i + 1}. ${g.label || g.model || g.key || "Unknown guitar"}
              ${g.nickname ? ` — "${g.nickname}"` : ""}
              ${g.type ? ` (${g.type})` : ""}
            </li>
          `).join("")
        : `<li>${metadata.guitarSummary || "No guitar details found"}</li>`;

      console.log("METADATA:", session.metadata);

      const orderDetails = {
        stripeSessionId: session.id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email || session.customer_email,
        customerName: session.customer_details?.name,
        amountTotal: session.amount_total,
        currency: session.currency,
      };

      console.log("ORDER PAID:", JSON.stringify(orderDetails, null, 2));

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "orders@myguitarfamily.com",
          to: "ddp62@hotmail.com",
          subject: "🎸 New Order Received - MyGuitarFamily",
          html: `
            <h2>New MyGuitarFamily Order</h2>

            <p><strong>Name:</strong> ${orderDetails.customerName}</p>
            <p><strong>Email:</strong> ${orderDetails.customerEmail}</p>
            <p><strong>Amount:</strong> $${orderDetails.amountTotal / 100}</p>
            <p><strong>Session ID:</strong> ${orderDetails.stripeSessionId}</p>

            <h3>Sticker Details</h3>
            <p><strong>Caption:</strong> ${metadata.caption || "None"}</p>
            <p><strong>Sticker Size:</strong> ${metadata.stickerSize || "Not provided"}</p>
            <p><strong>Quantity:</strong> ${metadata.stickerQuantity || "1"}</p>
            <p><strong>Digital Download:</strong> ${metadata.hasDigital === "true" ? "Yes" : "No"}</p>

            <h3>Guitars</h3>
            <ul>
              ${guitarListHtml}
            </ul>
          `,
        }),
      });

      const emailResult = await emailResponse.text();

      console.log("RESEND STATUS:", emailResponse.status);
      console.log("RESEND RESPONSE:", emailResult);
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