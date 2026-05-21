// Background service worker — makes API calls on behalf of content scripts,
// bypassing CORS restrictions that apply to content script fetches.

// ── GA4 Measurement Protocol ────────────────────────────────────────────────
// Get API secret: GA4 Admin → Data Streams → your stream → Measurement Protocol API secrets
const GA_MEASUREMENT_ID = 'G-E5K5FSXPFW';
const GA_API_SECRET = 'REPLACE_WITH_YOUR_API_SECRET';

async function gaClientId() {
  return new Promise(resolve => {
    chrome.storage.local.get('_ga_cid', d => {
      if (d._ga_cid) { resolve(d._ga_cid); return; }
      const id = crypto.randomUUID();
      chrome.storage.local.set({ _ga_cid: id });
      resolve(id);
    });
  });
}

async function trackEvent(name, params = {}) {
  if (GA_API_SECRET === 'REPLACE_WITH_YOUR_API_SECRET') return;
  try {
    const client_id = await gaClientId();
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
      {
        method: 'POST',
        body: JSON.stringify({ client_id, events: [{ name, params }] }),
      }
    );
  } catch (_) {}
}

// ── Message router ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'track') {
    trackEvent(message.event, message.params || {});
    return false;
  }

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
