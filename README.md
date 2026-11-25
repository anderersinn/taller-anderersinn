# Taller virtual Anderer Sinn

Prototipo estático del taller virtual para el *Sprint de Diseño de Producto Tech*.

## Estado actual

Integración completa del frontend con Firebase Authentication y Cloud Firestore.

- Inicio de sesión con Google desde `index.html` y desde la página de acceso no disponible.
- Guard de autorización en `curso.html` y `semana.html` antes de leer cualquier documento del curso.
- Autorización activa mediante `students/{uid}` o `admins/{uid}`.
- Navegación construida desde `courses/{courseId}`.
- Contenido semanal construido desde `courses/{courseId}/weeks/{weekId}`.
- Listener de revocación sobre el documento que concedió el acceso.
- Registro de un ingreso por sesión en `students/{uid}/logins` para estudiantes activos.
- Página `analitica.html` solo para administradores activos, con resumen, tabla semanal y gráfico SVG.
- Cierre de sesión que limpia la vista privada.
- La vista previa `?preview=1` sigue disponible solo para revisión visual con datos públicos.
- `firestore.rules` se mantiene sincronizado con `lms_docs_bundle/firestore.rules`.

## Estructura

```text
aula-anderer-sinn/
├── index.html
├── curso.html
├── semana.html
├── analitica.html
├── acceso-no-disponible.html
├── 404.html
├── README.md
├── firestore.rules
└── assets/
    ├── css/styles.css
    ├── js/
    │   ├── app-path.js
    │   ├── firebase-config.js
    │   ├── firebase-init.js
    │   ├── auth.js
    │   ├── access-guard.js
    │   ├── login-log.js
    │   ├── admin-analytics.js
    │   ├── course-repository.js
    │   ├── data.js
    │   ├── ui.js
    │   ├── preview-data.js
    │   ├── navigation.js
    │   ├── course-content.js
    │   ├── home.js
    │   ├── protected-page.js
    │   └── access-page.js
    └── img/
        ├── favicon.png
        ├── logo-black.png
        └── logo.png
```

## Configuración fija

- `courseId`: `sprint-diseno-producto-tech`
- Colecciones: `students`, `admins`, `courses`
- Subcolección: `courses/{courseId}/weeks`, `students/{uid}/logins`
- Dominio autorizado: el host exacto de GitHub Pages, sin `https://` ni ruta.

La configuración pública de Firebase vive en `assets/js/firebase-config.js`. No es una credencial administrativa. No se deben usar claves de cuenta de servicio ni Admin SDK en el navegador. La creación de la colección `logins` es automática con la primera escritura; no hay índices compuestos que crear. Las reglas de `firestore.rules` deben publicarse desde Firebase Console antes de probar la analítica.

## Ver localmente

Desde esta carpeta, inicia cualquier servidor estático. Por ejemplo:

```bash
python3 -m http.server 8000
```

Luego abre:

- `http://localhost:8000/`
- `http://localhost:8000/curso.html`
- `http://localhost:8000/semana.html?semana=1`
- `http://localhost:8000/analitica.html`
- `http://localhost:8000/curso.html?preview=1`
- `http://localhost:8000/semana.html?semana=1&preview=1`
- `http://localhost:8000/acceso-no-disponible.html?reason=session`
- `http://localhost:8000/acceso-no-disponible.html?reason=permission`
- `http://localhost:8000/acceso-no-disponible.html?reason=error`
- `http://localhost:8000/ruta-inexistente.html`

Para probar sesión real en local, `localhost` debe estar en Firebase Authentication → Settings → Authorized domains.

La ruta `?preview=1` solo existe para revisar el diseño. No es un mecanismo de acceso.

## Flujo de acceso

1. `index.html` ofrece “Continuar con Google”.
2. `onAuthStateChanged` confirma la sesión.
3. El guard lee `students/{uid}`; si no autoriza, comprueba `admins/{uid}`.
4. Solo después de autorizar se leen `courses/{courseId}` y la semana solicitada.
5. Un estudiante activo registra un evento en `students/{uid}/logins` una vez por sesión.
6. `analitica.html` comprueba `admins/{uid}` antes de listar estudiantes o leer eventos.
7. Firestore vuelve a aplicar las reglas en cada lectura y escritura.
8. Si cambia `active`, el listener cierra la vista y redirige a acceso no disponible.
9. Ante `permission-denied`, error de red o configuración, la aplicación no muestra contenido privado.

## Pruebas antes de matricular estudiantes

Sigue los criterios de `lms_docs_bundle/requerimientos_lms_estatico.md` y el manual de instalación.

- Sin sesión: abrir `curso.html`, `semana.html?semana=1` y `analitica.html` debe llevar a `reason=session`.
- Cuenta autenticada sin documento: debe mostrar `reason=permission`.
- Cuenta con `active: false`: debe mostrar `reason=permission`.
- Cuenta activa sin el `courseId`: debe mostrar `reason=permission`.
- Cuenta autorizada: debe ver menú y semanas publicadas.
- Estudiante en `analitica.html`: debe mostrar `reason=permission`.
- Administrador en `analitica.html`: debe ver selector, totales, tabla y gráfico.
- Rules Playground: un usuario no autenticado no debe poder leer `courses/sprint-diseno-producto-tech` ni la subcolección `logins`.
- Un estudiante no debe leer el documento de otro ni listar colecciones.
- Recargar el aula en la misma sesión no debe crear un segundo evento en `logins`.
- Desactivar un estudiante en una sesión activa debe cerrar la vista del curso.
- Drive debe permanecer en modo Restringido.
- Cada Google Forms restringido debe tener configurados sus respondientes.

No matricules estudiantes hasta que todas las pruebas pasen.

## Manuales de referencia

- `lms_docs_bundle/requerimientos_lms_estatico.md`
- `lms_docs_bundle/manual-instalacion.md`
- `lms_docs_bundle/manual_operativo_lms_anderer_sinn.md`
- `lms_docs_bundle/firestore.rules`
