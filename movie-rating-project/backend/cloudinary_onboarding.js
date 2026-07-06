const cloudinary = require('cloudinary').v2;

// 1. Configure Cloudinary
cloudinary.config({ 
  cloud_name: 'fkjcxcyn', 
  api_key: '935926531784336', 
  api_secret: 'eJFrphSieLGH36gqIri_UIzS2bQ' 
});

(async function run() {
  try {
    // 2. Upload an image
    const uploadResult = await cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg', {
        public_id: 'sample_uploaded'
    });
    console.log("Upload Secure URL:", uploadResult.secure_url);
    console.log("Public ID:", uploadResult.public_id);

    // 3. Get image details
    const details = await cloudinary.api.resource(uploadResult.public_id);
    console.log(`\nMetadata:\n- Width: ${details.width}\n- Height: ${details.height}\n- Format: ${details.format}\n- Size: ${details.bytes} bytes`);

    // 4. Transform the image
    // fetch_format: 'auto' (f_auto) selects the best format automatically (like webp)
    // quality: 'auto' (q_auto) automatically adjusts compression for optimal size/quality
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
        fetch_format: 'auto',
        quality: 'auto'
    });
    
    console.log("\nDone! Click link below to see optimized version of the image. Check the size and the format.");
    console.log(transformedUrl);

  } catch (error) {
    console.error("Error:", error);
  }
})();
