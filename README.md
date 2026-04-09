# Portal de Extracción de Comprobantes

Frontend corporativo desarrollado con React + Vite + TypeScript + TailwindCSS, preparado para AWS Amplify Hosting.

La aplicación se conecta directo a una Lambda mediante Function URL para extraer información estructurada de cualquier comprobante de pago.

## Requisitos

- Node.js 18+
- npm 9+

## Variables de entorno

Crea un archivo `.env` (puedes copiar desde `.env.example`) con:

```env
VITE_LAMBDA_FUNCTION_URL=https://tu-function-url.lambda-url.us-east-1.on.aws/
```
- `VITE_LAMBDA_FUNCTION_URL`: endpoint directo de la Lambda Function URL usado por el frontend.

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
3. El frontend envía `fileName`, `mimeType`, `fileBase64` y `expectedData` opcional directo a la Function URL de Lambda.
4. Se muestra loading mientras responde Lambda.
5. Se renderiza el resultado con:
   - estado
   - resumen
   - campos extraídos del comprobante
   - issues/observaciones
   - JSON completo de extracción (desplegable + copiar JSON)

## Estructura relevante

```text
amplify/
  functions/Validarcomprobante/
    handler.py
    resource.ts
src/
  components/result/ValidationResultView.tsx
  components/ui/UploadDropzone.tsx
  hooks/useFileUpload.ts
  lib/fileToBase64.ts
  lib/api.ts
  pages/ValidatePage.tsx
  types/validation.ts
```

La extracción ocurre siempre en Lambda. El frontend no realiza OCR ni validación local.

## Despliegue en AWS Amplify Hosting

1. Crea una app en AWS Amplify y conecta este repositorio.
2. Configura la variable de entorno en Amplify:
   - `VITE_LAMBDA_FUNCTION_URL=https://tu-function-url.lambda-url.us-east-1.on.aws/`
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

- El frontend siempre llama al Lambda; no existe camino local de extracción.
- La Lambda devuelve campos normalizados y el JSON estructurado completo del comprobante.
- El flujo está pensado para comprobantes de distintos bancos, países y formatos, no solo Venezuela.
