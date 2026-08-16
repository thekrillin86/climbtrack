/**
 * ClimbTrack · configuración de Firebase
 * archivo nuevo: src/firebaseConfig.js
 *
 * Estas claves NO son secretas. Van dentro del código que se descarga
 * cualquiera que abra la app: Google las documenta como públicas.
 * Lo que protege los datos son las reglas de Firestore, que solo dejan
 * leer y escribir bajo /usuarios/{tu uid}/.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBGx8opb5I3hKq2f9H86jokp0tn-_yRG1Q",
  authDomain: "climbtrack-f8a98.firebaseapp.com",
  projectId: "climbtrack-f8a98",
  storageBucket: "climbtrack-f8a98.firebasestorage.app",
  messagingSenderId: "166344502469",
  appId: "1:166344502469:web:5220f599867bd0f11314ac",
};
