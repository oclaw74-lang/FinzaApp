// Custom service worker — extends the auto-generated one from vite-plugin-pwa.
// Handles incoming Web Push notifications and shows them to the user.

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Finza', body: event.data.text() }
  }

  const title = payload.title ?? 'Finza'
  const options = {
    body: payload.body ?? '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: payload.tag ?? 'finza-notif',
    renotify: true,
    data: payload.url ? { url: payload.url } : undefined,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
