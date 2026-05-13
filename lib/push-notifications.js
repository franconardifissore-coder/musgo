(function attachPushNotifications(global) {
  // Clave pública VAPID — debe coincidir con VAPID_PUBLIC_KEY en los secrets de Supabase
  const VAPID_PUBLIC_KEY = 'BL-hJhANA3A-wgs0uujfVlxIjEF0Ry4CX-0FrkyjODDTZ-2EF35JdgUBHYLDUpmHI8UlqgmQpe5lsccEMQNzofE';

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  function isSupported() {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  function getPermissionStatus() {
    if (!isSupported()) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
  }

  async function getRegistration() {
    if (!('serviceWorker' in navigator)) return null;
    return navigator.serviceWorker.ready;
  }

  async function getCurrentSubscription() {
    const reg = await getRegistration();
    if (!reg) return null;
    return reg.pushManager.getSubscription();
  }

  async function subscribe() {
    if (!isSupported()) {
      return { ok: false, reason: 'unsupported' };
    }

    // Pedir permiso si todavía no se decidió
    if (Notification.permission === 'denied') {
      return { ok: false, reason: 'denied' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { ok: false, reason: 'denied' };
    }

    const reg = await getRegistration();
    if (!reg) return { ok: false, reason: 'no_sw' };

    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Guardar en Supabase
    const saved = await saveSubscription(subscription);
    if (!saved) return { ok: false, reason: 'save_failed' };

    return { ok: true, subscription };
  }

  async function unsubscribe() {
    const subscription = await getCurrentSubscription();
    if (!subscription) return { ok: true };

    // Eliminar de Supabase
    await deleteSubscription(subscription.endpoint);

    await subscription.unsubscribe();
    return { ok: true };
  }

  async function saveSubscription(subscription) {
    try {
      const client = global.supabaseAuth?.getClient?.();
      if (!client) return false;

      const json = subscription.toJSON();
      const { error } = await client.from('push_subscriptions').upsert({
        endpoint: json.endpoint,
        p256dh:   json.keys.p256dh,
        auth:     json.keys.auth,
      }, { onConflict: 'user_id,endpoint' });

      if (error) {
        console.error('[Push] Error guardando suscripción:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Push] Error inesperado al guardar:', err);
      return false;
    }
  }

  async function deleteSubscription(endpoint) {
    try {
      const client = global.supabaseAuth?.getClient?.();
      if (!client) return;
      await client.from('push_subscriptions').delete().eq('endpoint', endpoint);
    } catch (err) {
      console.error('[Push] Error eliminando suscripción:', err);
    }
  }

  global.musgoPush = {
    isSupported,
    getPermissionStatus,
    getCurrentSubscription,
    subscribe,
    unsubscribe,
  };
})(window);
