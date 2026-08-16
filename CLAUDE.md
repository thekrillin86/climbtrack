# ClimbTrack — instrucciones para Claude

Aplicación personal de Joan (Juan) López para registrar y analizar su
entrenamiento de escalada. **No es un proyecto de juguete: contiene años de
datos que no existen en ningún otro sitio.** Léete esto entero antes de tocar
nada.

---

## 1. Lo primero: la regla que no se rompe

**Los datos de Juan son irreemplazables y viven solo en el navegador de su
móvil.** No hay servidor. No hay copia automática. Si una migración los
corrompe, se han perdido.

Por eso:

- Ninguna migración escribe hasta haber verificado que **ninguna colección ha
  encogido**. Esa comprobación está en `src/migrations.js` y no se quita.
- Antes de escribir se guarda `ct5_preMigrationBackup`.
- Si algo falla, no se escribe **nada** y se aborta con aviso.
- Nunca borres un campo antiguo. Se añaden campos nuevos al lado
  (`ejercicios` → se conserva; `ejerciciosCat` → se añade).
- `textoOriginal` se conserva SIEMPRE en cualquier ejercicio parseado.

Si vas a proponer algo que toque datos, dilo antes y explica qué se pierde en
el peor caso.

---

## 2. Cómo se guardan los datos (esto ha causado bugs reales)

Almacenamiento: **IndexedDB** vía `keyval-store` / `keyval`, expuesto como
`window.storage`.

```js
// src/lib.js — literal
export async function ld(k,f=[]){try{const r=await window.storage.get(k);return r?JSON.parse(r.value):f}catch{return f}}
export async function sv(k,d){try{await window.storage.set(k,JSON.stringify(d))}catch(e){console.error(e)}}
```

**`window.storage.get(k)` devuelve un objeto envoltorio `{key, value}`, no el
valor.** Hay que leer `.value` y luego `JSON.parse`. Si escribes un
diagnóstico en la consola y te sale `null` o `0` en todo, casi seguro es esto.

### Claves reales (todas con prefijo `ct5_`)

Colecciones que migran:

| Clave        | Contenido                        |
|--------------|----------------------------------|
| `ct5_cal`    | Calendario: un registro por día  |
| `ct5_ent`    | Entrenamientos con bloques       |
| `ct5_roca`   | Salidas y vías de roca           |
| `ct5_lib`    | Libreta (solo encadenes ≥ 7a)    |
| `ct5_t25`    | Tests Tindeq                     |
| `ct5_treg`   | Registro de regletas             |
| `ct5_dp`     | Datos de perfil                  |
| `ct5_tests`  | Tests                            |

No son colecciones y no van en `CLAVES`: `ct5_init`, `ct5_lastBackup`,
`ct5_schemaVersion`, `ct5_migrationLog`, `ct5_preMigrationBackup`.

---

## 3. Migraciones

`src/migrations.js`, `ESQUEMA_ACTUAL = 5`. Para añadir una migración:

1. Escribe la función en su módulo (`migrarLoQueSea(datos) → datos`).
2. Impórtala en `migrations.js` y añádela a `MIGRACIONES` con la clave
   siguiente.
3. Sube `ESQUEMA_ACTUAL` en 1.

Reglas:

- Una migración recibe **todo** el conjunto (`{ct5_cal:[], ct5_ent:[], ...}`)
  y devuelve uno nuevo. No muta el de entrada.
- Debe ser **idempotente**: ejecutarla mil veces da el mismo resultado. Las
  correcciones puntuales (ver `src/ciclos.js`) solo se aplican si el valor
  actual es exactamente el que se espera.
- Se ejecuta al arrancar, después de que `ld('ct5_init')` devuelva `true`.

Migraciones existentes: 1 sin-op · 2 catálogo de ejercicios · 3 Suunto ·
4 agarres · 5 corrección de etiquetas de ciclo.

---

## 4. Modelo de carga — decisiones ya tomadas, no las deshagas

`src/carga.js`. Tres cosas que parecen mejorables y no lo son:

**a) Tres canales, nunca un total.** `dedos`, `cuerpo`, `sistemico` se
muestran por separado. No existe método aceptado para sumar carga entre
modalidades distintas (Dhahbi 2024). Un "total" sería un número inventado.

**b) Dos escalas de intensidad, dos curvas de coste distintas.**

- `costeIntensidad(f)` — para **%MVC**. Aplica el umbral de oclusión: por
  debajo del 65,6 % no acumula (Bergua et al. 2021, media de 34 escaladores;
  rango individual 45–75 %).
- `costeEsfuerzo(f)` — para **RPE o fatiga percibida**. **No aplica umbral.**

Aplicar el umbral de oclusión a un RPE es un error de categoría: el umbral
está definido sobre porcentaje de fuerza máxima, no sobre esfuerzo percibido.
Ese bug ya se cometió una vez y daba `dedos = 0` en días de roca completos.

**c) τ distinto por canal** (`dedos: 2.5`, `cuerpo: 1.5`, `sistemico: 1.0`
días). Los dedos se recuperan más lento. No los unifiques.

Todos los parámetros están en `PARAMS`, arriba del fichero, a la vista y
editables. Mantenlo así: nada de constantes escondidas a mitad de función.

---

## 5. Taxonomía de agarres — es la de Juan, son siete

`src/agarres.js`: canto, regleta mediana, regleta pequeña, pinza, romo,
bidedo, monodedo. No la simplifiques ni la agrupes.

Se rellenan de dos formas: las suspensiones se deducen solas del tamaño de
regleta (`agarrePorRegleta`), y roca/rocódromo se marcan a mano pero se
heredan por vía (`sugerirAgarres`).

Umbrales actuales (`UMBRALES_MM`): ≥30 mm canto, ≥20 regleta mediana, resto
regleta pequeña. Son propuesta, no criterio de Juan — si los cambia, hay que
volver a migrar.

---

## 6. Lo que Juan NO quiere en la app

- **Predicciones.** Había una gráfica de predicción de rendimiento en el
  dashboard y la quitó: no la leía porque no la consideraba objetiva. El
  dashboard da estado actual y motivos, no futuros.
- **Cajas negras.** Si un número sale de algo, la pantalla dice de dónde sale.
  Ver la tarjeta "De dónde sale cada número" en `CargaP.jsx`.
- **Datos inventados para rellenar huecos.** Si falta el dato, se dice que
  falta.

---

## 7. Contexto de sus datos (para no decir tonterías)

- **La libreta no está abandonada.** Solo apunta encadenes de **7a en
  adelante**. Lleva meses de sequía porque está con proyectos duros. Si
  cuentas entradas y te parece poco, es por eso.
- Los mesociclos duran entre **13 y 67 días**. Cualquier comparación entre
  ciclos se normaliza **por semana**, nunca en total.
- Hay 0 minutos de bidedo registrados en todo el histórico, mientras se cae
  en el bidedo de Amapolla. Es un hallazgo real, no un fallo de datos.

---

## 8. Estructura y despliegue

```
src/
  App.jsx        448 líneas — punto de entrada, pestañas, formularios
  lib.js         núcleo antiguo: ld/sv, calcBanister, fingerLoad,
                 tendonAlert, calcReadiness, calcCFW, parseRow, ACTS, GR
  migrations.js  sistema de migraciones (fase 1)
  catalogo.js    11 tipos de ejercicio + parseo de texto libre (fase 2)
  suunto.js      extracción de datos del reloj (fase 3)
  agarres.js     7 tipos de agarre (fase 4a)
  carga.js       modelo de carga por canales
  ciclos.js      macro/mesociclos + migración 5
  DashP.jsx      dashboard nuevo (sustituye a Dash, que sigue en App.jsx
                 sin usar, para poder revertir cambiando una palabra)
  CargaP.jsx     pestaña Carga
  CiclosP.jsx    pestaña Ciclos
  styles.js
```

- Stack: React 18 + Vite 5 + `vite-plugin-pwa` + recharts.
- Rama: **`master`** (no `main`).
- Despliegue: **Netlify**, automático al hacer push a `master`.
  No hay que hacer nada más: `git push` y en un par de minutos está online.
- No hay tests. Si añades algo con lógica no trivial, plantéalo.

---

## 9. Cómo trabajar con Juan

- **Español.** Directo, sin rodeos ni entusiasmo de folleto.
- **Si tiene que hacer algo él, paso a paso, sin dar nada por sabido.** Lo ha
  pedido explícitamente. Incluye la ruta exacta, el comando exacto y qué
  debería salir por pantalla.
- Es su dominio: sabe de escalada más que tú. Si te corrige sobre agarres,
  grados o metodología, tiene razón él.
- No afirmes nada sobre el código sin haberlo leído en el fichero. Ya hubo un
  episodio de inventarse una función que no existía a partir de un resumen.

---

## 10. Pendiente

- [ ] Firestore: sincronización y copia de seguridad real (ahora mismo un
      móvil perdido = todos los datos perdidos). Debe funcionar **offline en
      la roca**: caché local, sincroniza al recuperar cobertura.
- [ ] Copia semanal automática a Drive (`05.- APP ESCALADA`).
- [ ] Chips de agarre en el formulario de rocódromo (en roca ya están).
- [ ] Iconos `maskable` en el manifest (ahora se ven con marco blanco al
      instalar en Android).
- [ ] Unificar `ct5_cal` / `ct5_ent` / `ct5_roca` en una colección `sesiones`.
      **Es el cambio de mayor riesgo del proyecto. Va el último y con la
      copia de seguridad verificada.**
- [ ] Revisar solapes de mesociclos 1/3 y 1/4 (dos semanas de solape, puede
      haber más etiquetas mal).
