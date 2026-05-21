// Background service worker — makes API calls on behalf of content scripts,
// bypassing CORS restrictions that apply to content script fetches.

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'improve') return false;

  fetch('https://www.midjourney-prompt-generator.eu/api/improve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: message.prompt }),
  })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      sendResponse({ ok: true, improved: data.improved });
    })
    .catch((err) => {
      sendResponse({ ok: false, error: err.message || 'Request failed' });
    });

  return true; // keep message channel open for async response
});
