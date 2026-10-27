import { Jimp } from "jimp";

async function run() {
  try {
    console.log("Jimp object:", Jimp);
    // Let's create an empty white image
    const image = new Jimp({ width: 100, height: 100, color: 0xffffffff });
    console.log("Image width:", image.width, "height:", image.height);
    const buf = await image.getBuffer("image/jpeg");
    console.log("Successfully got buffer!", buf.length);
  } catch (err: any) {
    console.error("Error with Jimp:", err.message);
  }
}

run();
