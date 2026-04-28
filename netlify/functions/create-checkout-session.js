const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event) {
  try {
    const data = JSON.parse(event.body || '{}');

    const guitars = data.guitars || [];
    const caption = data.caption || '';
    const stickerSize = data.stickerSize || '6';
    const stickerQuantity = parseInt(data.stickerQuantity || '1', 10);
    const hasDigital = data.hasDigital || false;
    const stickerType = data.stickerType || 'standard';
    const stickerImageUrl = data.stickerImageUrl || "";

    let basePrice = 2999;

    if (stickerSize === "3" || stickerSize === "4") basePrice = 2499;
    if (stickerSize === "6") basePrice = 2999;
    if (stickerSize === "9" || stickerSize === "8") basePrice = 3499;
    if (stickerType === "inside-window") basePrice += 500;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Custom Guitar Family",
            },
            unit_amount: basePrice,
          },
          quantity: stickerQuantity,
        },
      ],

       metadata: {
        guitars: JSON.stringify(guitars),
        caption: (caption || '').replace(/"/g, "'").slice(0, 500),
        stickerSize: stickerSize.toString(),
        stickerQuantity: stickerQuantity.toString(),
        hasDigital: hasDigital.toString(),
        stickerImageUrl: stickerImageUrl,
        stickerType: stickerType,
        guitarSummary: guitars.map(g =>
          `${g.label || g.model || g.key}${g.nickname ? ` "${g.nickname}"` : ""}${g.type ? ` (${g.type})` : ""}`
        ).join(" | ").slice(0, 500),
      },
      success_url: "https://myguitarfamily.com/success.html",
      cancel_url: "https://myguitarfamily.com/cancel.html",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: err.message,
    };
  }
};