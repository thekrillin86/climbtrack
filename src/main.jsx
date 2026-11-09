import React from 'react';
import ReactDOM from 'react-dom/client';
import { LazyMotion, domAnimation, MotionConfig } from 'motion/react';
// Letra local: se empaqueta con la app. Nada se pide a Google al abrirla.
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow/latin-600.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import App from './App.jsx';
import { CSS } from './styles.js';
import { aplicarTema } from './tema.js';
// Almacén de los datos (IndexedDB 'keyval-store' / 'keyval', el de siempre).
// Va empaquetado con la app y con versión fija: antes se bajaba de esm.sh en
// cada arranque, así que la app no abría sin cobertura y cualquier cambio en
// ese servidor llegaba directo al código que lee y escribe tus datos.
import { get, set } from 'idb-keyval';
window.storage = {
  get: async (k) => { try { const v = await get(k); return v != null ? { key: k, value: v } : null; } catch { return null; } },
  set: async (k, v) => { try { await set(k, v); return { key: k, value: v }; } catch { return null; } }
};
// Tema y estilos antes de pintar nada: sin parpadeo, y también para la
// pantalla de fallo, que no pasa por App.
aplicarTema();
const hoja = document.createElement('style');
hoja.id = 'climbtrack-css';
hoja.textContent = CSS;
document.head.appendChild(hoja);
// reducedMotion="user": si el móvil pide reducir el movimiento, la app no anima.
ReactDOM.createRoot(document.getElementById('root')).render(
  <MotionConfig reducedMotion="user">
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>
  </MotionConfig>
);
