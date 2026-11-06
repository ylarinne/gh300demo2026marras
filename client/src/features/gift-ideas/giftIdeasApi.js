export async function fetchGiftIdeas({ signal } = {}) {
  const response = await fetch("/api/gift-ideas", { signal });
  if (!response.ok) {
    throw new Error(`Gift ideas request failed (${response.status})`);
  }
  return response.json();
}

export async function createGiftIdea(giftIdea) {
  const response = await fetch("/api/gift-ideas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(giftIdea)
  });
  if (!response.ok) {
    throw new Error(`Gift idea creation failed (${response.status})`);
  }
  return response.json();
}

export async function deleteGiftIdea(id) {
  const response = await fetch(`/api/gift-ideas/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Gift idea deletion failed (${response.status})`);
  }
}