import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/api'

const VAPID_KEY_ENDPOINT = '/notificaciones/vapid-public-key'
const SUBSCRIBE_ENDPOINT = '/notificaciones/subscribe'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const { session } = useAuthStore()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const subscribe = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push] Not supported in this browser')
      return false
    }
    if (!session) return false

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return false

      const keyRes = await apiClient.get<{ public_key: string }>(VAPID_KEY_ENDPOINT)
      const vapidPublicKey = keyRes.data.public_key
      if (!vapidPublicKey) {
        console.warn('[Push] VAPID public key not configured on server')
        return false
      }

      const sw = await navigator.serviceWorker.ready
      const existing = await sw.pushManager.getSubscription()
      if (existing) {
        setSubscribed(true)
        return true
      }

      const subscription = await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      const json = subscription.toJSON()
      await apiClient.post(SUBSCRIBE_ENDPOINT, {
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      })

      setSubscribed(true)
      return true
    } catch (err) {
      console.error('[Push] Subscribe error:', err)
      return false
    }
  }

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator)) return
    try {
      const sw = await navigator.serviceWorker.ready
      const sub = await sw.pushManager.getSubscription()
      setSubscribed(!!sub)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (session) checkSubscription()
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  return { permission, subscribed, subscribe }
}
