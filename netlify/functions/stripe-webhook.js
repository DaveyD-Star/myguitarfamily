exports.handler = async function (event) {
  try {
    console.log("Webhook received");

    return {
      statusCode: 200,
      body: "Webhook received",
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: err.message,
    };
  }
};