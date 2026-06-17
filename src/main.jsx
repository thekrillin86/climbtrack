import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { get, set } from 'https://esm.sh/idb-keyval@6';
window.storage = {
  get: async (k) => { try { const v = await get(k); return v != null ? { key: k, value: v } : null; } catch { return null; } },
  set: async (k, v) => { try { await set(k, v); return { key: k, value: v }; } catch { return null; } }
};
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
