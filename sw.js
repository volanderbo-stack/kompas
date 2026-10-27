// Service worker «Компаса»: робота офлайн.
// Після змін у файлах збільште VERSION — тоді старий кеш видалиться.
// Додали новий файл — допишіть його у FILES.
const VERSION = 'kompas-v3';

const FILES = [
  './',
  './index.html',
  './styles.css',
  './data.js',
  './manifest.json',
  './js/storage.js',
  './js/ui.js',
  './js/router.js',
  './js/app.js',
  './js/screens/home.js',
  './js/screens/sens.js',
  './js/screens/people.js',
  './js/screens/tools.js',
  './js/screens/prompts.js',
  './js/screens/projects.js',
  './js/screens/life.js',
  './js/screens/settings.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

// Встановлення: завантажуємо всі файли свіжими, повз HTTP-кеш браузера
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(FILES.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

// Активація: видаляємо кеші старих версій
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Свої файли: одразу з кешу (швидко і офлайн), а у фоні — оновлення з мережі.
// Чужі адреси (YouTube тощо) не чіпаємо.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(request, { ignoreSearch: true });

    const fromNetwork = fetch(request, { cache: 'no-cache' })
      .then(response => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
      .catch(() => null);

    if (cached) {
      event.waitUntil(fromNetwork);
      return cached;
    }
    const response = await fromNetwork;
    if (response) return response;
    if (request.mode === 'navigate') return cache.match('./index.html');
    return new Response('', { status: 504, statusText: 'Offline' });
  })());
});
