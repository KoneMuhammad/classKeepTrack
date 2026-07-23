import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("visitor-data");
  const current = Number(await store.get("count")) || 0;

  const url = new URL(req.url);
  const cookies = req.headers.get("cookie") || "";
  const seen = cookies.includes("visitor_seen=1");

  let count;
  if (!seen) {
    count = current + 1;
    await store.set("count", String(count));
  } else {
    count = current;
  }

  return new Response(JSON.stringify({ count }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "visitor_seen=1; Path=/; Max-Age=315360000; SameSite=Lax",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
