// Bot Studio's background helper: shows the owner's alerts and opens the right page when one is tapped.
// No offline copy of pages: Bot Studio always loads fresh, so the owner never sees old houses or old chats.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: "Bot Studio", body: e.data?.text() || "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Bot Studio", {
    body: d.body || "",
    tag: d.tag || undefined, // a newer alert about the same thing replaces the older one
    renotify: !!d.tag,
    icon: "/site/img/logo-192.png",
    badge: "/site/img/logo-64.png",
    data: { url: d.url || "/" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "/", self.location.origin).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const studio = wins.find((w) => new URL(w.url).pathname === "/");
    if (studio) { await studio.focus(); return studio.navigate(url).catch(() => studio.postMessage({ open: url })); }
    return self.clients.openWindow(url);
  })());
});
