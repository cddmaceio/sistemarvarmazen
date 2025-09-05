// Service Worker para PWA - Prioriza conexão online para dados do banco
const CACHE_NAME = 'rv-armazem-v1';
const STATIC_CACHE = 'rv-armazem-static-v1';

// Recursos estáticos para cache
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// URLs da API que devem sempre buscar online
const API_PATTERNS = [
  /\/api\//,
  /supabase/,
  /netlify\/functions/
];

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker: Recursos estáticos em cache');
        return self.skipWaiting();
      })
  );
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('Service Worker: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Ativado');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Verificar se é uma requisição de API
  const isApiRequest = API_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  if (isApiRequest) {
    // Para APIs: SEMPRE tentar online primeiro (Network First)
    event.respondWith(networkFirstStrategy(request));
  } else {
    // Para recursos estáticos: Cache primeiro, depois rede
    event.respondWith(cacheFirstStrategy(request));
  }
});

// Estratégia Network First para APIs (prioriza online)
async function networkFirstStrategy(request) {
  // Para APIs em desenvolvimento local, não interceptar - deixar passar direto
  if (request.url.includes('localhost') || request.url.includes('127.0.0.1')) {
    console.log('Service Worker: Passando direto para API local:', request.url);
    return fetch(request);
  }
  
  try {
    console.log('Service Worker: Buscando online:', request.url);
    
    // Tentar buscar online sem timeout agressivo
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      console.log('Service Worker: Resposta online obtida:', request.url);
      return networkResponse;
    }
    
    // Se resposta não é OK, mas ainda é uma resposta válida, retornar
    console.warn('Service Worker: Resposta não OK:', networkResponse.status, request.url);
    return networkResponse;
    
  } catch (error) {
    console.warn('Service Worker: Falha na conexão online:', error.message);
    
    // Se falhar, tentar cache (apenas para GET)
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('Service Worker: Usando cache para:', request.url);
        return cachedResponse;
      }
    }
    
    // Se não há cache, retornar erro de rede
    return new Response(
      JSON.stringify({ 
        error: 'Sem conexão com o servidor',
        message: 'Verifique sua conexão com a internet',
        offline: true
      }), 
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Estratégia Cache First para recursos estáticos
async function cacheFirstStrategy(request) {
  try {
    // Tentar cache primeiro
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('Service Worker: Servindo do cache:', request.url);
      return cachedResponse;
    }
    
    // Se não está em cache, buscar online
    console.log('Service Worker: Buscando online (estático):', request.url);
    const networkResponse = await fetch(request);
    
    // Cachear se for um recurso estático válido
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Service Worker: Erro ao buscar recurso:', error);
    
    // Para páginas HTML, retornar página offline básica
    if (request.destination === 'document') {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Offline - RV Armazém</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline { color: #666; }
          </style>
        </head>
        <body>
          <div class="offline">
            <h1>Você está offline</h1>
            <p>Verifique sua conexão com a internet e tente novamente.</p>
            <button onclick="window.location.reload()">Tentar Novamente</button>
          </div>
        </body>
        </html>`,
        {
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
    
    throw error;
  }
}

// Monitorar status da conexão
self.addEventListener('online', () => {
  console.log('Service Worker: Conexão online restaurada');
  // Notificar clientes sobre conexão restaurada
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'ONLINE' });
    });
  });
});

self.addEventListener('offline', () => {
  console.log('Service Worker: Conexão offline detectada');
  // Notificar clientes sobre perda de conexão
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'OFFLINE' });
    });
  });
});

// Sincronização em background (quando voltar online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Sincronização em background');
    event.waitUntil(syncData());
  }
});

// Função para sincronizar dados quando voltar online
async function syncData() {
  try {
    // Aqui você pode implementar lógica para sincronizar dados
    // que foram modificados offline
    console.log('Service Worker: Sincronizando dados...');
    
    // Notificar clientes sobre sincronização
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE' });
    });
    
  } catch (error) {
    console.error('Service Worker: Erro na sincronização:', error);
  }
}