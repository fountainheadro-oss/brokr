import axios from "axios";

async function checkUrl(url: string) {
  try {
    const res = await axios.head(url);
    console.log(`URL: ${url} -> STATUS: ${res.status}`);
    return true;
  } catch (err: any) {
    console.log(`URL: ${url} -> FAILED: ${err.message}`);
    return false;
  }
}

async function run() {
  const mainHash = "13788dffb3ec7b62c3d9bc630202a60b";
  const path = "prod-property-core-backend-media-imo/96458033/9061de8e-8c99-48ed-9c1e-597af8742ee1.jpeg";

  // eyJvdyI6IiJ9 is {"ow":""}
  // eyJvdyI6IiAifQ is {"ow":" "}
  // eyJvdyI6Ii4ifQ is {"ow":"."}
  // e30 is {}
  // eyJvdyI6InAifQ is {"ow":"p"} (a single character 'p')
  
  const urlsToTest = [
    `https://i.roamcdn.net/prop/imo/gallery-full-1200w-watermark/${mainHash}/-eyJvdyI6IiJ9/${path}`,
    `https://i.roamcdn.net/prop/imo/gallery-full-1200w-watermark/${mainHash}/-eyJvdyI6IiAifQ/${path}`,
    `https://i.roamcdn.net/prop/imo/gallery-full-1200w-watermark/${mainHash}/-eyJvdyI6Ii4ifQ/${path}`,
    `https://i.roamcdn.net/prop/imo/gallery-full-1200w-watermark/${mainHash}/-e30/${path}`,
    `https://i.roamcdn.net/prop/imo/gallery-full-1200w-watermark/${mainHash}/-eyJvdyI6InAifQ/${path}`,
  ];

  for (const u of urlsToTest) {
    await checkUrl(u);
  }
}

run();
