// public/sw.js
importScripts('https://cdnjs.cloudflare.com/ajax/libs/tweetnacl/1.0.3/nacl-fast.min.js');

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      handlePush(data)
    );
  }
});

async function handlePush(data) {
  // Default notification
  let title = data.title;
  let body = data.body;

  try {
    // Try to open IndexedDB to check settings and decrypt
    const db = await openDB('opaque-messenger', 2);
    const settings = await getFromDB(db, 'settings', 'previews');
    
    if (settings && settings.enabled && data.encryptedPayload) {
      // Logic for background decryption would go here
      // For now, we'll signal that we have a message but keep it secure
      // unless the app is open. 
      // Full background decryption requires bundling the ratchet logic into SW.
      body = "New encrypted message received.";
    }
  } catch (err) {
    console.error('SW Push handling error:', err);
  }

  return self.registration.showNotification(title, {
    body: body,
    icon: '/shield.svg',
    badge: '/shield.svg',
    data: { url: '/' }
  });
}

// Simple IDB helpers for SW
function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getFromDB(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
