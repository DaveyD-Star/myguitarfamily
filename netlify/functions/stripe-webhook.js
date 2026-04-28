exports.handler = async function (event) {
  try {
    const stripeEvent = JSON.parse(event.body);

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;
      const metadata = session.metadata || {};
      const guitarListHtml = metadata.guitarSummary
      ? metadata.guitarSummary
          .split(" | ")
          .map((item, i) => `<li>${i + 1}. ${item}</li>`)
          .join("")
      : "<li>No guitar details found</li>";

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

            <h3>Sticker Image</h3>
            <p>
              <a href="${metadata.stickerImageUrl}" target="_blank">
                View / Download Sticker Image
              </a>
            </p>

            <img src="${metadata.stickerImageUrl}" style="max-width:300px;border:1px solid #ccc;" />

            <h3>Guitars</h3>
            <ul>
              ${guitarListHtml}
            </ul>
          `,
        }),
      });

      // ─────────────────────────────────────────────
      // CUSTOMER CONFIRMATION EMAIL
      // ─────────────────────────────────────────────
      const customerEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "orders@myguitarfamily.com",
          to: orderDetails.customerEmail,
          subject: "🎸 Your MyGuitarFamily Order is Confirmed!",
          html: `
            <h2>Thanks for your order, ${orderDetails.customerName || "there"}! 🎸</h2>

            <p>We’ve received your custom guitar family sticker order and it’s now being prepared.</p>

            <h3>Order Summary</h3>
            <p><strong>Order ID:</strong> ${orderDetails.stripeSessionId}</p>
            <p><strong>Amount Paid:</strong> $${orderDetails.amountTotal / 100}</p>

            <h3>Your Sticker</h3>
            <p><strong>Caption:</strong> ${metadata.caption || "None"}</p>
            <p><strong>Size:</strong> ${metadata.stickerSize || "Not specified"}</p>
            <p><strong>Quantity:</strong> ${metadata.stickerQuantity || "1"}</p>

            <h3>Preview</h3>
            <img src="${metadata.stickerImageUrl}" style="max-width:300px;border:1px solid #ccc;" />

            ${
              metadata.hasDigital === "true"
                ? `
              <h3>Your Digital Download</h3>
              <p>
                <a href="${metadata.stickerImageUrl}" target="_blank">
                  Click here to download your sticker image
                </a>
              </p>
            `
                : `
              <p>Your custom sticker will be produced and shipped soon.</p>
            `
            }

            <p style="margin-top:20px;">
              We’ll keep you updated as your order progresses.
            </p>

            <p>— MyGuitarFamily 🎸</p>
          `,
        }),
      });

      const customerEmailResult = await customerEmailResponse.text();
      console.log("CUSTOMER EMAIL STATUS:", customerEmailResponse.status);
      console.log("CUSTOMER EMAIL RESPONSE:", customerEmailResult);

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