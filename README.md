# Portal de Validación de Comprobantes

Frontend institucional desarrollado con React + Vite + TypeScript + TailwindCSS, preparado para AWS Amplify Hosting. Simula el flujo de validación de comprobantes de pago con una capa API mock desacoplada para conectar posteriormente con AWS Lambda.

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
npm install
```

## Ejecución local

```bash
npm run dev
```

La aplicación quedará disponible por defecto en `http://localhost:5173`.

## Build de producción

```bash
npm run build
```

Para previsualizar el build local:

```bash
npm run preview
```

## Rutas principales

- `/` Inicio / Landing
- `/validar` Carga y validación de comprobante
- `/procesando` Estado de procesamiento
- `/resultado` Resultado de validación
- `/historial` Historial mock de validaciones

## Estructura del proyecto

```text
src/
  assets/             Recursos estáticos
  components/         Componentes reutilizables UI
  data/               Mocks de resultados e historial
  hooks/              Hooks de lógica de carga
  layouts/            Estructura base (header/footer)
  lib/                Utilidades y capa API mock
  pages/              Pantallas por ruta
  types/              Tipos e interfaces TypeScript
```

## Capa API mock y preparación para Lambda

La capa en `src/lib/api.ts` expone:

- `uploadReceipt()`
- `validateReceipt()`
- `getValidationResult()`
- `getValidationHistory()`

Estas funciones usan promesas y latencia artificial (`setTimeout`) para simular llamadas asíncronas. Para integrar backend real, reemplaza internamente estas funciones por invocaciones a API Gateway / Lambda manteniendo la misma firma.

## Despliegue en AWS Amplify Hosting

1. Crea una app en AWS Amplify y conecta este repositorio.
2. Amplify detectará Vite automáticamente.
3. Configuración recomendada de build:

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

4. Publica la rama deseada.

## Notas

- Actualmente el flujo opera con datos mock locales.
- El diseño está optimizado para desktop, tablet y móvil.
- La base está lista para evolucionar a entorno productivo con integración serverless en AWS.
