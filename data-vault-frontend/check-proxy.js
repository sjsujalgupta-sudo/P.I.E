async function check() {
  const res = await fetch("http://localhost:3000/api/proxy/vault");
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Data length:", data.length);
  if (data.length > 0) {
    console.log("Sample:", JSON.stringify(data[0], null, 2));
  }
}

check().catch(console.error);
