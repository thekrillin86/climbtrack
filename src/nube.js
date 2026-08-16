/**
 * ClimbTrack · copia en la nube (Firestore)
 * archivo nuevo: src/nube.js
 *
 * PRINCIPIO DE DISEÑO, y no es negociable:
 *
 *   La app NUNCA depende de la nube. Si Firebase está caído, si no hay
 *   cobertura, si no has iniciado sesión — la app funciona exactamente
 *   igual que antes. IndexedDB sigue siendo la verdad.
 *
 * Esto no es un motor de sincronización bidireccional. Es una COPIA DE
 * SEGURIDAD AUTOMÁTICA con restauración manual. Para un tío con un móvil,
 * montar resolución de conflictos distribuida es meterse en un problema
 * más grande que el que resuelve.
 *
 *   - Cada vez que se guarda algo en local, se sube también. Si no hay
 *     cobertura, Firestore lo encola en su caché y lo sube al volver.
 *   - Lo de la nube NUNCA sobrescribe lo local por su cuenta. Restaurar
 *     es una decisión manual y pasa por el mismo portero que el resto.
 *
 * Firebase se carga con import dinámico: la app arranca sin esperarlo.
 */

import { alGuardarEnNube } from './lib.js';
import { CLAVES } from './migrations.js';

let fb = null;             // { app, auth, db, fn: {...} }
let usuario = null;
let avisar = () => {};
let temporizadores = {};
let estado = {
  disponible: false,       // Firebase ha cargado
  usuario: null,
  pendientes: 0,
  ultimaSubida: null,
  ultimoError: null,
};

const emitir = () => avisar({ ...estado });

/* ------------------------------------------------------------------
   Carga perezosa del SDK
   ------------------------------------------------------------------ */
async function cargar() {
  if (fb) return fb;
  const [{ initializeApp }, auth, fs, { firebaseConfig }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
    import('./firebaseConfig.js'),
  ]);

  const app = initializeApp(firebaseConfig);
  const db = fs.initializeFirestore(app, {
    localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
  });
  fb = { app, db, auth: auth.getAuth(app), fs, fnAuth: auth };
  return fb;
}

/* ------------------------------------------------------------------
   Arranque
   ------------------------------------------------------------------ */
export async function iniciarNube(onEstado) {
  if (typeof onEstado === 'function') avisar = onEstado;

  // Pide al navegador que no borre el almacenamiento. Safari purga los
  // datos de scripts a los 7 días sin interacción si no se pide esto.
  try { await navigator.storage?.persist?.(); } catch { /* da igual */ }

  try {
    const { auth, fnAuth } = await cargar();
    estado.disponible = true;
    fnAuth.onAuthStateChanged(auth, u => {
      usuario = u;
      estado.usuario = u ? u.email : null;
      estado.ultimoError = null;
      emitir();
      if (u) reconciliar();
    });
  } catch (e) {
    estado.disponible = false;
    estado.ultimoError = 'No se ha podido cargar Firebase: ' + (e?.message || e);
    console.warn('[nube]', e);
  }
  emitir();

  // Engancha el guardado local: cada sv() dispara una subida.
  alGuardarEnNube((clave, datos) => programarSubida(clave, datos));
}

/* ------------------------------------------------------------------
   Sesión
   ------------------------------------------------------------------ */
export async function entrar(email, contrasena) {
  const { auth, fnAuth } = await cargar();
  try {
    await fnAuth.signInWithEmailAndPassword(auth, email.trim(), contrasena);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: mensajeError(e) };
  }
}

export async function salir() {
  const { auth, fnAuth } = await cargar();
  await fnAuth.signOut(auth);
}

function mensajeError(e) {
  const c = e?.code || '';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found'))
    return 'Correo o contraseña incorrectos.';
  if (c.includes('too-many-requests'))
    return 'Demasiados intentos. Espera unos minutos.';
  if (c.includes('network'))
    return 'Sin conexión. Los datos locales están a salvo, inténtalo luego.';
  return e?.message || String(e);
}

/* ------------------------------------------------------------------
   Subida
   ------------------------------------------------------------------ */
function programarSubida(clave, datos) {
  if (!usuario || !CLAVES.includes(clave)) return;
  clearTimeout(temporizadores[clave]);
  estado.pendientes = Object.keys(temporizadores).length;
  emitir();
  temporizadores[clave] = setTimeout(() => subirClave(clave, datos), 2000);
}

async function subirClave(clave, datos) {
  delete temporizadores[clave];
  if (!usuario) return;
  try {
    const { db, fs } = await cargar();
    const ref = fs.doc(db, 'usuarios', usuario.uid, 'datos', clave);
    await fs.setDoc(ref, {
      json: JSON.stringify(datos),
      n: Array.isArray(datos) ? datos.length : 0,
      ts: new Date().toISOString(),
      servidor: fs.serverTimestamp(),
    });
    estado.ultimaSubida = new Date().toISOString();
    estado.ultimoError = null;
  } catch (e) {
    // No se propaga: un fallo de nube jamás debe romper un guardado local.
    estado.ultimoError = 'Error al subir ' + clave + ': ' + (e?.message || e);
    console.warn('[nube]', e);
  }
  estado.pendientes = Object.keys(temporizadores).length;
  emitir();
}

/** Sube las 8 colecciones enteras. Se usa la primera vez y a mano. */
export async function subirTodo(leer) {
  if (!usuario) return { ok: false, error: 'No has iniciado sesión.' };
  try {
    const { db, fs } = await cargar();
    const lote = fs.writeBatch(db);
    let total = 0;
    for (const clave of CLAVES) {
      const datos = await leer(clave, []);
      total += Array.isArray(datos) ? datos.length : 0;
      lote.set(fs.doc(db, 'usuarios', usuario.uid, 'datos', clave), {
        json: JSON.stringify(datos),
        n: Array.isArray(datos) ? datos.length : 0,
        ts: new Date().toISOString(),
        servidor: fs.serverTimestamp(),
      });
    }
    await lote.commit();
    estado.ultimaSubida = new Date().toISOString();
    estado.ultimoError = null;
    emitir();
    return { ok: true, total };
  } catch (e) {
    estado.ultimoError = e?.message || String(e);
    emitir();
    return { ok: false, error: e?.message || String(e) };
  }
}

/**
 * Reconciliación al arrancar. Sube toda colección cuyo número de registros
 * en local no coincida con el de la nube.
 *
 * Por qué hace falta: si apunta una sesión en el sector sin cobertura y
 * Firebase ni siquiera llegó a cargar, ese guardado no pasó por el gancho y
 * nadie lo habría subido nunca. Comparando al arrancar, el sistema se cura
 * solo sin necesidad de una cola de pendientes propia.
 *
 * Solo sube: jamás baja nada por su cuenta.
 */
let yaComprobado = false;
async function reconciliar() {
  if (yaComprobado) return;
  yaComprobado = true;
  try {
    const resumen = await leerResumenNube();
    if (!resumen.ok) return;
    const { ld } = await import('./lib.js');
    const desfasadas = [];
    for (const clave of CLAVES) {
      const local = await ld(clave, []);
      const nLocal = Array.isArray(local) ? local.length : 0;
      if (nLocal !== (resumen.por[clave] ?? -1)) desfasadas.push([clave, local, nLocal]);
    }
    if (!desfasadas.length) console.log('[nube] al dia');
    else console.log('[nube] reconciliando', desfasadas.map(d => `${d[0]} (${d[2]})`).join(', '));
    for (const [clave, datos] of desfasadas) await subirClave(clave, datos);
  } catch (e) { console.warn('[nube]', e); }
  try {
    const { ld } = await import('./lib.js');
    await guardarHistorico(ld);          // foto de la semana, si no la hay ya
  } catch (e) { console.warn('[nube]', e); }
}

/* ------------------------------------------------------------------
   Lectura y restauración
   ------------------------------------------------------------------ */
export async function leerResumenNube() {
  if (!usuario) return { ok: false, error: 'No has iniciado sesión.' };
  try {
    const { db, fs } = await cargar();
    const snap = await fs.getDocs(fs.collection(db, 'usuarios', usuario.uid, 'datos'));
    const por = {};
    let total = 0, ts = null;
    snap.forEach(d => {
      const v = d.data();
      por[d.id] = v.n || 0;
      total += v.n || 0;
      if (!ts || (v.ts && v.ts > ts)) ts = v.ts;
    });
    return { ok: true, por, total, ts };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

/**
 * Descarga lo que hay en la nube. NO escribe nada: devuelve el objeto para
 * que quien llame lo pase por el portero de confirmación.
 */
export async function descargarTodo() {
  if (!usuario) return { ok: false, error: 'No has iniciado sesión.' };
  try {
    const { db, fs } = await cargar();
    const snap = await fs.getDocs(fs.collection(db, 'usuarios', usuario.uid, 'datos'));
    if (snap.empty) return { ok: false, error: 'No hay ninguna copia en la nube todavía.' };
    const datos = {};
    snap.forEach(d => {
      try { datos[d.id] = JSON.parse(d.data().json); }
      catch { datos[d.id] = null; }
    });
    for (const c of CLAVES) {
      if (!Array.isArray(datos[c])) {
        return { ok: false, error: `La copia de la nube está incompleta o corrupta (${c}). No se ha tocado nada.` };
      }
    }
    return { ok: true, datos };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

/* ------------------------------------------------------------------
   HISTÓRICO SEMANAL · puntos de restauración

   La nube y el móvil son dos copias VIVAS: están sincronizadas, así que un
   fallo que borre un registro lo borra en las dos en dos segundos. Esto es
   lo otro: una foto congelada por semana a la que se puede volver.

   Una foto por semana, con las 8 colecciones dentro de un solo documento
   (~90 KB hoy, el límite son 1 MiB). No se borran: a 90 KB por semana, el
   plan gratuito de 1 GiB da para siglos.
   ------------------------------------------------------------------ */

/** Identificador de la semana: la fecha del lunes, en local. */
export function claveSemana(fecha = new Date()) {
  const d = new Date(fecha);
  const dow = (d.getDay() + 6) % 7;              // lunes = 0
  d.setDate(d.getDate() - dow);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Guarda la foto de esta semana si no existe ya. No pisa la que haya. */
export async function guardarHistorico(leer) {
  if (!usuario) return { ok: false, error: 'No has iniciado sesión.' };
  try {
    const { db, fs } = await cargar();
    const id = claveSemana();
    const ref = fs.doc(db, 'usuarios', usuario.uid, 'historial', id);
    const ya = await fs.getDoc(ref);
    if (ya.exists()) return { ok: true, id, nuevo: false };

    const datos = {};
    let total = 0;
    for (const clave of CLAVES) {
      const v = await leer(clave, []);
      datos[clave] = v;
      total += Array.isArray(v) ? v.length : 0;
    }
    const json = JSON.stringify(datos);
    if (json.length > 900000) {
      return { ok: false, error: 'Los datos ya no caben en una sola foto (>900 KB). Hay que partir el histórico por colección.' };
    }
    await fs.setDoc(ref, { json, total, ts: new Date().toISOString(), servidor: fs.serverTimestamp() });
    console.log('[nube] foto semanal guardada:', id, total, 'registros');
    return { ok: true, id, nuevo: true, total };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

/** Lista de fotos disponibles, de la más reciente a la más antigua. */
export async function listarHistorico() {
  if (!usuario) return { ok: false, error: 'No has iniciado sesión.' };
  try {
    const { db, fs } = await cargar();
    const snap = await fs.getDocs(fs.collection(db, 'usuarios', usuario.uid, 'historial'));
    const fotos = [];
    snap.forEach(d => fotos.push({ id: d.id, total: d.data().total || 0, ts: d.data().ts }));
    fotos.sort((a, b) => (a.id < b.id ? 1 : -1));
    return { ok: true, fotos };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

/** Descarga una foto concreta. No escribe nada: lo valida y lo devuelve. */
export async function descargarHistorico(id) {
  if (!usuario) return { ok: false, error: 'No has iniciado sesión.' };
  try {
    const { db, fs } = await cargar();
    const d = await fs.getDoc(fs.doc(db, 'usuarios', usuario.uid, 'historial', id));
    if (!d.exists()) return { ok: false, error: 'Esa foto ya no existe.' };
    const datos = JSON.parse(d.data().json);
    for (const c of CLAVES) {
      if (!Array.isArray(datos[c])) {
        return { ok: false, error: `La foto está incompleta (${c}). No se ha tocado nada.` };
      }
    }
    return { ok: true, datos };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export function estadoNube() { return { ...estado }; }
