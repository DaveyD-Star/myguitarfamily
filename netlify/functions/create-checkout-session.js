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

    if (stickerSize === "6") basePrice = 2999;
    if (stickerSize === "9") basePrice = 3499;
    if (stickerSize === "12") basePrice = 3999;

    if (stickerType === "inside-window") basePrice += 500;

    let discount = 0;

    if (stickerQuantity === 2) discount = 750;
    if (stickerQuantity === 3) discount = 1500;

    const totalAmount = (basePrice * stickerQuantity) - discount;
    
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
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],

      metadata: {
        guitars: JSON.stringify(guitars).replace(/"/g, "'").slice(0, 500),
        caption: (caption || '').replace(/"/g, "'").slice(0, 500),
        stickerSize: stickerSize.toString(),
        stickerQuantity: stickerQuantity.toString(),
        hasDigital: hasDigital.toString(),
        stickerImageUrl: stickerImageUrl,
        stickerType: stickerType,
        guitarSummary: guitars.map(g =>
          `${g.label || g.model || g.key}${g.nickname ? ` '${g.nickname}'` : ""}${g.type ? ` (${g.type})` : ""}`
        ).join(" | ").replace(/"/g, "'").slice(0, 500),
      },

      success_url: "https://myguitarfamily.com/success.html",
      cancel_url: "https://myguitarfamily.com/cancel.html",
    });


    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
  console.error("Create checkout error:", err);

  return {
    statusCode: 500,
    body: JSON.stringify({ error: err.message }),
  };
}
};