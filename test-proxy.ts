import axios from "axios";

async function run() {
  const url = "https://i.roamcdn.net/prop/imo/gallery-full-1200w-watermark/13788dffb3ec7b62c3d9bc630202a60b/-eyJvdyI6Ikdlb3JnZSBMZW90ZXNjdSJ9/prod-property-core-backend-media-imo/96458033/9061de8e-8c99-48ed-9c1e-597af8742ee1.jpeg";
  
  const serverUrl = `http://localhost:3000/api/proxy-image?url=${encodeURIComponent(url)}`;
  try {
    const res = await axios.get(serverUrl);
    console.log("PROXY RESULT STATUS:", res.status);
    console.log("CONTENT TYPE:", res.headers["content-type"]);
  } catch (err: any) {
    if (err.response) {
      console.log("PROXY RESULT ERROR:", err.response.status, err.response.data);
    } else {
      console.log("PROXY RESULT ERROR:", err.message);
    }
  }
}

run();
