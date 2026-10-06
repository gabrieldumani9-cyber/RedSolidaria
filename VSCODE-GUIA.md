# Cómo abrir y ejecutar RedSolidaria en Visual Studio Code

## 1. Abrir el proyecto

1. Abre Visual Studio Code.
2. Ve a **Archivo → Abrir carpeta…** (o *File → Open Folder…*).
3. Selecciona la carpeta raíz del proyecto (la que contiene `package.json` y `angular.json`).

## 2. Instalar las extensiones recomendadas

Al abrir el proyecto, VS Code mostrará una notificación con las extensiones recomendadas.
Haz clic en **Instalar todo** (o *Install All*). Incluyen:

- **Angular Language Service** — autocompletado y validación de plantillas Angular.
- **Prettier** — formateo de código al guardar.
- **ESLint** — detección de errores.
- **Tailwind CSS IntelliSense** — autocompletado de clases Tailwind.

También puedes instalarlas manualmente desde la pestaña de Extensiones
buscando las que aparecen en `.vscode/extensions.json`.

## 3. Instalar las dependencias del proyecto

Abre la terminal integrada de VS Code (**Ver → Terminal** o `Ctrl+J` / `Cmd+J`)
y ejecuta:

```bash
npm install
```

Esto solo es necesario la primera vez.

## 4. Levantar el servidor de desarrollo

Tienes dos opciones:

### Opción A — Desde la terminal

```bash
npm start
```

El servidor arrancará en `http://localhost:4200` y se abrirá automáticamente
en tu navegador.

### Opción B — Con la configuración de VS Code (recomendada)

1. Ve a **Ejecutar y Depurar** (el icono de play con un insecto en la barra lateral,
   o `Ctrl+Shift+D` / `Cmd+Shift+D`).
2. En el menú desplegable superior, selecciona
   **"Iniciar servidor de desarrollo (ng serve)"**.
3. Pulsa el botón verde de **Play** (o `F5`).

El servidor arrancará en la terminal integrada de VS Code y abrirá
`http://localhost:4200` automáticamente.

## 5. Compilar para producción

Desde **Ejecutar y Depurar**, selecciona
**"Compilar para producción (ng build)"** y pulsa Play.
El resultado se generará en la carpeta `dist/`.

También puedes ejecutarlo desde la terminal:

```bash
npm run build
```

## 6. Tareas disponibles

Pulsa `Ctrl+Shift+P` / `Cmd+Shift+P` y escribe **"Tareas: Ejecutar Tarea"**
para ver:

- **Servidor de desarrollo** — arranca `ng serve`.
- **Compilar proyecto** — ejecuta `ng build`.
- **Instalar dependencias** — ejecuta `npm install`.

## Resumen rápido

```bash
npm install   # solo la primera vez
npm start     # servidor de desarrollo en http://localhost:4200
```

¡Listo! Ya puedes trabajar en RedSolidaria desde Visual Studio Code.
