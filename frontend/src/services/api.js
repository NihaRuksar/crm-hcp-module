const BASE_URL = "https://crm-hcp-module-production.up.railway.app/";

export async function sendChatMessage(message, tool, interactionId, currentData) {
  const response = await fetch(BASE_URL + "/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: message,
      tool: tool,
      interaction_id: interactionId || null,
      current_data: currentData || null,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Server error " + response.status + ": " + errorText);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function saveInteraction(formData) {
  const response = await fetch(BASE_URL + "/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  if (!response.ok) throw new Error("Save failed: " + response.status);
  return response.json();
}

export async function updateInteraction(id, changes) {
  const response = await fetch(BASE_URL + "/interactions/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  if (!response.ok) throw new Error("Update failed: " + response.status);
  return response.json();
}

export async function fetchInteractions() {
  const response = await fetch(BASE_URL + "/interactions");
  if (!response.ok) throw new Error("Failed to fetch interactions");
  return response.json();
}
