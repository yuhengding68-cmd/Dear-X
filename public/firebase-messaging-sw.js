/* DearX web push worker.
   Background display needs the public Firebase web config in this file.
   Copy the same values as VITE_FIREBASE_* from the Firebase console.
   Do not put a private key, service account, or Gemini key here.
   Until firebase.initializeApp is filled in, the page can still register this
   worker; background notifications will not show. */
self.addEventListener('push', (event) => {
  let title = 'DearX';
  let body = '';
  try {
    const payload = event.data ? event.data.json() : {};
    const note = payload.notification && typeof payload.notification === 'object' ? payload.notification : {};
    if (typeof note.title === 'string' && note.title) title = note.title;
    if (typeof note.body === 'string') body = note.body;
  } catch {
    body = '';
  }
  event.waitUntil(self.registration.showNotification(title, { body }));
});
