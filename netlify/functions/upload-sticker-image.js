const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async function (event) {
  try {
    const { imageData } = JSON.parse(event.body || "{}");

    if (!imageData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing imageData" }),
      };
    }

    const uploadResult = await cloudinary.uploader.upload(imageData, {
      folder: "myguitarfamily/orders",
      resource_type: "image",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      }),
    };
  } catch (err) {
    console.error("Cloudinary upload error:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};