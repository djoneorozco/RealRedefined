fetch("https://api.realredefined.ai/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ responses: answers })
})
