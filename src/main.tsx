import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App.tsx";

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registrado com sucesso:', registration.scope);
        
        // Escutar atualizações do service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão disponível
                console.log('Nova versão do app disponível!');
                if (confirm('Nova versão disponível! Deseja atualizar?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('Falha ao registrar SW:', error);
      });
  });
  
  // Escutar mensagens do service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type } = event.data;
    
    switch (type) {
      case 'ONLINE':
        console.log('Conexão online restaurada');
        // Você pode mostrar uma notificação aqui
        break;
      case 'OFFLINE':
        console.log('Conexão offline detectada');
        // Você pode mostrar uma notificação aqui
        break;
      case 'SYNC_COMPLETE':
        console.log('Sincronização completa');
        break;
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
