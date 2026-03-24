# Portal de Validación de Comprobantes

Frontend corporativo desarrollado con React + Vite + TypeScript + TailwindCSS, preparado para AWS Amplify Hosting.

La validación principal se conecta a un API Gateway real que invoca una Lambda para extraer y validar datos del comprobante.

## Requisitos

- Node.js 18+
- npm 9+

## Variables de entorno

Crea un archivo `.env` (puedes copiar desde `.env.example`) con:

```env
VITE_VALIDATE_API_URL=https://y2fkkc2ru5.execute-api.us-east-1.amazonaws.com/validate
VITE_VALIDATION_MODE=mock
```

- `VITE_VALIDATION_MODE=mock`: ejecuta extracción simulada local (sin invocar Lambda).
- `VITE_VALIDATION_MODE=api`: usa API Gateway + Lambda real.

## Instalación

```bash
npm install
```

## Ejecución local

```bash
npm run dev
```

La app queda disponible por defecto en `http://localhost:5173`.

## Build de producción

```bash
npm run build
```

Previsualización local del build:

```bash
npm run preview
```

## Flujo funcional principal (`/validar`)

1. El usuario carga un archivo (`png`, `jpg`, `jpeg`, `webp`, `pdf`).
2. El frontend convierte el archivo a base64 en navegador (`FileReader.readAsDataURL`).
3. El frontend envía `fileName`, `mimeType`, `fileBase64` y `expectedData` opcional al API Gateway.
4. Se muestra loading mientras responde Lambda.
5. Se renderiza el resultado con:
   - estado
   - resumen
   - campos extraídos
   - issues/observaciones
   - JSON completo de extracción (desplegable + copiar JSON)

## Estructura relevante

```text
src/
  components/result/ValidationResultView.tsx
  components/ui/UploadDropzone.tsx
  hooks/useFileUpload.ts
  lib/fileToBase64.ts
  lib/api.ts
  pages/ValidatePage.tsx
  types/validation.ts
```

## Despliegue en AWS Amplify Hosting

1. Crea una app en AWS Amplify y conecta este repositorio.
2. Configura la variable de entorno en Amplify:
   - `VITE_VALIDATE_API_URL=https://y2fkkc2ru5.execute-api.us-east-1.amazonaws.com/validate`
3. Build recomendado:

```yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## Notas

- La validación principal ya no usa mocks.
- El historial puede seguir usando datos mock como vista auxiliar.
- El frontend está listo para operar en Amplify contra API Gateway + Lambda.
