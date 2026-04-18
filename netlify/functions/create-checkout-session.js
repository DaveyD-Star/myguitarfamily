const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async function () {
  try {
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
      success_url: "https://steady-sawine-124b76.netlify.app/success.html",
      cancel_url: "https://steady-sawine-124b76.netlify.app/cancel.html",
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