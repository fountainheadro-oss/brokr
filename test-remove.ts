import { Jimp } from "jimp";

async function run() {
  try {
    // Create a 1000x1000 white image
    const image = new Jimp({ width: 1000, height: 1000, color: 0xffffffff });
    
    // Draw some black pixels representing logo at (100, 100) with size 200x50
    for (let y = 100; y < 150; y++) {
      for (let x = 100; x < 300; x++) {
        image.setPixelColor(0x000000ff, x, y);
      }
    }
    
    console.log("Mock image size:", image.width, "x", image.height);
    
    // Bounding box of the logo: startX = 100, startY = 100, width = 200, height = 50
    // Try clone + crop + blur + composite
    const cropped = image.clone().crop({ x: 100, y: 100, w: 200, h: 50 });
    cropped.blur(10);
    image.composite(cropped, 100, 100);
    
    const buf = await image.getBuffer("image/jpeg");
    console.log("Successfully processed and got buffer of length:", buf.length);
  } catch (err: any) {
    console.error("Error with Jimp crop/blur:", err.stack);
  }
}

run();
