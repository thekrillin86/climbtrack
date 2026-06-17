# 🧗 ClimbTrack v6

App de seguimiento de escalada y entrenamiento. PWA mobile-first.

## Novedades v6
- **Auto-backup**: aviso en la cabecera si llevas >7 días sin exportar
- **Módulo Suspensiones Bergua**: MVC automático desde Tindeq, cálculo de carga objetivo, registro serie a serie, pérdida inter-series
- **Test CF / W'**: protocolo 7s:3s validado (Giles 2021, Baláš 2024)
- **Alerta ventana tendinosa**: avisa si vas a roca <72-96h tras suspensiones (Breda 2024)
- **ACWR por EWMA**: media exponencial, más precisa (Williams 2024)
- **Re-test RFD**: recordatorio cuando llevas >4 meses sin medir
- Botón eliminar en todas las pestañas

## Desarrollo local
```bash
npm install
npm run dev
```

## Despliegue (Netlify + GitHub)
1. Sube este repo a GitHub
2. En Netlify: "Add new site" → "Import an existing project" → conecta GitHub → elige el repo
3. Netlify detecta `netlify.toml` automáticamente. Build: `npm run build`, publish: `dist`
4. Cada `git push` despliega solo

## Datos
- Se guardan en IndexedDB del navegador (local)
- **Haz backup regularmente** (Más → Backup) — descarga un CSV
- Para sincronizar PC↔móvil: exporta CSV en uno, impórtalo en el otro
- El CSV es tu única copia de seguridad real

## Estructura
- `src/lib.js` — lógica: Banister, EWMA, ventana tendinosa, suspensiones, CF/W', backup
- `src/App.jsx` — interfaz y pestañas
- `src/styles.js` — estilos
- `src/main.jsx` — arranque + polyfill de almacenamiento
