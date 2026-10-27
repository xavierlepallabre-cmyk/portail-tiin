/* ==========================================================================
   Portail TIIN — service worker
   Rôle : ouvrir le portail rapidement et sans réseau.
   Il ne gère QUE les fichiers du portail (son dossier). Nucléa TIIN et
   Sûreté & Cycle TIIN ont leurs propres service workers : celui-ci ne les
   touche pas et ne garantit pas leur fonctionnement hors connexion.

   À chaque publication d'une nouvelle version, augmenter VERSION.
   ========================================================================== */
const VERSION = 'portail-tiin-v1.0.2';
const SCOPE = self.registration.scope;

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/css/portail.css',
  'assets/js/theme.js',
  'assets/js/portail.js',
  'assets/fonts/lexend-400.ttf',
  'assets/fonts/lexend-500.ttf',
  'assets/fonts/lexend-600.ttf',
  'assets/fonts/lexend-700.ttf',
  'assets/img/logo-bac-pro-tiin.png',
  'assets/img/apps/nuclea.svg',
  'assets/img/apps/surete-cycle.svg',
  'assets/img/apps/orbites.svg',
  'assets/img/apps/cycle.svg',
  'icons/icon.svg',
  'icons/icon-192.png',
  'data/catalogue.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('portail-tiin-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // On ne s'occupe que des fichiers du portail : rien d'autre n'est intercepté.
  if (!req.url.startsWith(SCOPE)) return;

  const url = new URL(req.url);
  const isCatalogue = url.pathname.endsWith('/data/catalogue.json');

  // Pages et catalogue : réseau d'abord (pour voir les nouveautés), cache si hors ligne.
  if (req.mode === 'navigate' || isCatalogue) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
    );
    return;
  }

  // Fichiers du portail (styles, images, documents consultés) : cache d'abord.
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
