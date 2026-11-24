# Aula virtual Anderer Sinn

Prototipo estático del aula virtual para el *Sprint de Diseño de Producto Tech*.

## Estado actual

Entregable de la Fase 1: páginas, menú visual e identidad de Anderer Sinn.

- Las cinco páginas están creadas: `index.html`, `curso.html`, `semana.html`, `acceso-no-disponible.html` y `404.html`.
- Las páginas protegidas muestran un estado neutro de configuración pendiente.
- La vista previa visual se abre con `?preview=1` y usa únicamente títulos públicos del currículo.
- No hay enlaces a Drive, Forms, correos de estudiantes ni manifiestos privados en este repositorio.
- `firestore.rules` se copió sin cambios desde `lms_docs_bundle/`.

## Estructura

```text
aula-anderer-sinn/
├── index.html
├── curso.html
├── semana.html
├── acceso-no-disponible.html
├── 404.html
├── README.md
├── firestore.rules
└── assets/
    ├── css/styles.css
    ├── js/
    │   ├── app-path.js
    │   ├── firebase-config.js
    │   ├── ui.js
    │   ├── preview-data.js
    │   ├── navigation.js
    │   ├── course-content.js
    │   ├── protected-page.js
    │   └── access-page.js
    └── img/
        ├── favicon.png
        ├── logo-black.png
        └── logo.png
```

## Ver localmente

Desde esta carpeta, inicia cualquier servidor estático. Por ejemplo:

```bash
python3 -m http.server 8000
```

Luego abre:

- `http://localhost:8000/`
- `http://localhost:8000/curso.html?preview=1`
- `http://localhost:8000/semana.html?semana=1&preview=1`
- `http://localhost:8000/acceso-no-disponible.html?reason=permission`
- `http://localhost:8000/acceso-no-disponible.html?reason=error`
- `http://localhost:8000/ruta-inexistente.html`

La ruta `?preview=1` solo existe para revisar el diseño. No es un mecanismo de acceso.

## Próxima configuración

Según `lms_docs_bundle/manual-instalacion.md`, se debe completar:

1. Repositorio GitHub y GitHub Pages desde la rama principal, carpeta raíz.
2. Proyecto Firebase y aplicación web.
3. Proveedor de Google en Authentication.
4. Dominio autorizado exacto de GitHub Pages, por ejemplo `TU_USUARIO.github.io`, sin `https://` ni ruta.
5. Cloud Firestore en modo producción.
6. Reglas publicadas desde `firestore.rules`.

Valores pendientes para la siguiente fase:

```javascript
const firebaseConfig = {
  apiKey: 'REEMPLAZAR_API_KEY',
  authDomain: 'REEMPLAZAR_PROJECT_ID.firebaseapp.com',
  projectId: 'REEMPLAZAR_PROJECT_ID',
  storageBucket: 'REEMPLAZAR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'REEMPLAZAR_SENDER_ID',
  appId: 'REEMPLAZAR_APP_ID'
};

const COURSE_ID = 'sprint-diseno-producto-tech';
```

Esos valores públicos se copiarán en `assets/js/firebase-config.js`. No se deben usar claves de cuenta de servicio ni Admin SDK en el navegador.

## Seguridad

GitHub Pages publica el HTML, CSS y JavaScript. La protección real se implementará con Firebase Authentication y Firestore Security Rules. El contenido privado vivirá en Firestore y los archivos en Google Drive con permisos restringidos.

Después de configurar Firebase se integrarán el guard de autorización, la navegación desde `courses/{courseId}` y el renderizado de semanas desde `courses/{courseId}/weeks/{weekId}`.

## Manuales de referencia

- `lms_docs_bundle/requerimientos_lms_estatico.md`
- `lms_docs_bundle/manual-instalacion.md`
- `lms_docs_bundle/manual_operativo_lms_anderer_sinn.md`
- `lms_docs_bundle/firestore.rules`
