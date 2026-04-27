const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


exports.handler = async function (event) {
  try {
    const data = JSON.parse(event.body || '{}');

    const guitars = data.guitars || [];
    const caption = data.caption || '';
    const color = data.color || {};
    const quantity = data.quantity || 1;
    const hasDigital = data.hasDigital || false;

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
            unit_amount: 2999, // $29.99
          },
          quantity: 1,
        },
      ],

       metadata: {
        guitars: JSON.stringify(guitars),
        caption: caption,
        color: JSON.stringify(color),
        quantity: quantity.toString(),
        hasDigital: hasDigital.toString()
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