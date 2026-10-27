import axios from "axios";

async function run() {
  const url = "https://www.imobiliare.ro/oferta/apartament-de-inchiriat-sector-6-grozavesti-mobilat-2-camere-1-270478187";
  try {
    const res = await axios.post("http://localhost:3000/api/crawl", { url });
    console.log("CRAWL RESULT STATUS:", res.status);
    console.log("TITLE:", res.data.title);
    console.log("IMAGES COUNT:", res.data.images?.length);
    console.log("IMAGES:", res.data.images);
  } catch (err: any) {
    if (err.response) {
      console.log("CRAWL ERROR STATUS:", err.response.status, err.response.data);
    } else {
      console.log("CRAWL ERROR:", err.message);
    }
  }
}

run();
