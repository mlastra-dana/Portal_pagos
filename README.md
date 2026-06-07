# Gestion de Pagos

Portal demo para gestion y validacion de pagos contra facturas pendientes. El flujo permite que un cliente ingrese con su documento, vea facturas o recibos pendientes, seleccione una factura, cargue un comprobante de pago y valide si el monto extraido coincide con el monto esperado.

El proyecto esta preparado para industrias como telco, seguros y banca, usando facturas mock para la demo y una Lambda en AWS para extraer datos estructurados desde comprobantes reales.

## Resumen Ejecutivo

El portal simula una experiencia de pago asistida por IA:

1. El cliente inicia sesion con cedula venezolana y contrasena.
2. El portal muestra facturas pendientes en bolivares.
3. El cliente puede ver o descargar una factura antes de pagarla.
4. Al seleccionar una factura, carga el comprobante asociado.
5. La IA extrae monto, moneda, fecha, referencia, beneficiario, bancos y cuenta destino.
6. El portal compara el monto y moneda detectados contra la factura seleccionada.
7. Si el pago coincide y los campos obligatorios fueron extraidos, permite continuar.
8. El flujo final permite adjuntar soportes adicionales y confirma que el pago fue asociado a la factura seleccionada.

La demo mantiene la logica futura esperada: el JSON resultante de extraccion podra enviarse luego a un API bancario o backend interno para validar referencia, cuenta, fecha y estado real del pago.

## Funcionalidad Implementada

### Login

- Pantalla de login visualmente alineada con la referencia corporativa de Example Company.
- Login por cedula venezolana:
  - prefijo desplegable: `V`, `E`, `J`, `G`
  - numero de cedula solo numerico
  - campo de contrasena
- La contrasena es libre para efectos de demo.
- La sesion del cliente se conserva durante la sesion del navegador.
- Solo el boton `Salir` limpia la sesion y devuelve al login.

### Facturas Pendientes

- Vista de facturas pendientes para el cliente autenticado.
- Facturas mock por industria:
  - Telco
  - Seguros
  - Banco
- Todas las facturas estan expresadas en bolivares (`VES`).
- Cada factura incluye:
  - proveedor
  - concepto
  - numero de factura
  - referencia interna
  - vencimiento
  - monto
- Acciones por factura:
  - ver factura
  - descargar factura
  - pagar factura

### Validacion de Pago

- El usuario carga el comprobante asociado a la factura seleccionada.
- La extraccion se ejecuta automaticamente al cargar el archivo.
- La pantalla muestra:
  - comprobante cargado
  - datos extraidos
  - resultado de comparacion
  - observaciones solo cuando aportan informacion adicional
  - JSON de extraccion cuando aplica
- Si el archivo no parece un comprobante de pago, se muestra un mensaje unico:

```text
Esto no parece un comprobante de pago. Adjunte un comprobante de pago valido.
```

- En ese caso se ocultan los datos extraidos y el JSON, porque no hay informacion util que revisar.

### Reglas de Aprobacion

Un comprobante solo puede avanzar como valido cuando:

- el monto detectado coincide con el monto de la factura
- la moneda detectada coincide con la moneda esperada
- se extrajo monto
- se extrajo fecha
- se extrajo referencia u operacion
- el comprobante no indica estado pendiente, fallido, rechazado, anulado o reversado

Si el monto no coincide, el portal rechaza el pago aunque la IA haya extraido correctamente todos los campos.

### Documentos Adjuntos

- Luego de una validacion exitosa, el usuario puede adjuntar documentos complementarios.
- Formatos permitidos:
  - PDF
  - JPG/JPEG
  - PNG
  - WEBP
  - DOC
  - DOCX
- El bloque de archivos adjuntos solo aparece cuando existen documentos cargados.
- Al volver desde esta pantalla, se conserva el comprobante principal y el resultado de validacion anterior.

### Persistencia de Sesion

El portal conserva el proceso activo aunque el usuario:

- use el boton `Volver`
- refresque el navegador
- navegue entre facturas, validacion, adjuntos y resultado

La sesion se guarda en `sessionStorage` y en memoria de la aplicacion. Solo se limpia con `Salir`.

## Detalle Tecnico

### Stack Frontend

- React
- Vite
- TypeScript
- TailwindCSS
- `pdfjs-dist` para renderizar PDFs antes de enviarlos a Lambda

### Preparacion de Archivos

El frontend prepara los comprobantes antes de enviarlos:

- PDFs: se renderiza la primera pagina como imagen JPEG comprimida.
- Imagenes grandes: se redimensionan y comprimen como JPEG.
- Esto evita errores `413 Payload Too Large` al invocar Lambda Function URL.
- La llamada al Lambda usa un `Content-Type` simple para evitar problemas de CORS/preflight.
- Hay reintento corto ante errores temporales de red.
- La pantalla evita llamadas duplicadas por efectos dobles de React en modo desarrollo.

### Lambda de Extraccion

Lambda en AWS:

```text
Lambda
Functions
ValidacionPagos

ValidacionPagos
```

En el repositorio, el codigo local esta bajo:

```text
amplify/functions/Validarcomprobante/
  handler.py
  extraction_prompt.py
  resource.ts
```

La Lambda:

- recibe `fileName`, `mimeType`, `fileBase64` y `expectedData`
- invoca Amazon Bedrock mediante Converse API
- extrae datos estructurados del comprobante
- normaliza monto, fecha, moneda, referencia, bancos, beneficiario, cuenta y estado de pago
- devuelve un JSON normalizado al frontend
- puede persistir resultado y archivo fuente en S3 si se configura `RESULT_BUCKET`

### Modelo Bedrock

El modelo por defecto configurado es:

```text
us.anthropic.claude-sonnet-4-5-20250929-v1:0
```

La variable de entorno usada por Lambda:

```env
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-5-20250929-v1:0
```

Tambien usa:

```env
BEDROCK_REGION=us-east-1
RESULT_BUCKET=
RESULT_PREFIX=receipt-validations
```

### Prompt

El prompt de extraccion fue separado del handler para evitar que el codigo principal crezca demasiado:

```text
amplify/functions/Validarcomprobante/extraction_prompt.py
```

El prompt instruye a la IA a:

- responder solo JSON valido
- no inventar bancos, montos, fechas, referencias ni cuentas
- distinguir concepto de beneficiario
- extraer el monto efectivamente transferido
- no usar saldos, comisiones, limites, deudas o tasas como monto
- normalizar `Bs`, `Bs.`, `Bs.S`, `BsS`, bolivares y `VES` como `VES`
- detectar estado del pago:
  - `COMPLETED`
  - `PENDING`
  - `FAILED`
  - `UNKNOWN`
- rechazar comprobantes que indiquen `En proceso`, `Pendiente`, `Rechazado`, `Fallido`, `Anulado` o `Reversado`
- marcar documentos que no parecen comprobantes de pago

## Variables de Entorno Frontend

Crea un archivo `.env` a partir de `.env.example`:

```env
VITE_LAMBDA_FUNCTION_URL=https://tu-function-url.lambda-url.us-east-1.on.aws/
```

- `VITE_LAMBDA_FUNCTION_URL`: endpoint directo de la Lambda Function URL usado por el frontend.
- `VITE_VALIDATE_API_URL`: fallback compatible con versiones previas.

## Instalacion

```bash
npm install
```

## Ejecucion Local

```bash
npm run dev
```

La app queda disponible por defecto en:

```text
http://localhost:5173
```

Tambien puede levantarse fijando host:

```bash
npm run dev -- --host 127.0.0.1
```

## Build de Produccion

```bash
npm run build
```

Previsualizacion local del build:

```bash
npm run preview
```

## Estructura Relevante

```text
amplify/
  functions/
    Validarcomprobante/
      handler.py
      extraction_prompt.py
      resource.ts
src/
  components/
    result/
      ValidationResultView.tsx
    ui/
      FilePreviewCard.tsx
      UploadDropzone.tsx
  hooks/
    useFileUpload.ts
  lib/
    activeValidationSession.ts
    api.ts
    fileToBase64.ts
    invoiceValidation.ts
  mocks/
    pendingInvoices.ts
  pages/
    HomePage.tsx
    PendingInvoicesPage.tsx
    ValidatePage.tsx
    ComplementaryDocumentsPage.tsx
    ResultPage.tsx
  types/
    invoice.ts
    validation.ts
```

## Despliegue en AWS Amplify Hosting

1. Crear o abrir la app en AWS Amplify Hosting.
2. Conectar el repositorio.
3. Configurar la variable de entorno:

```env
VITE_LAMBDA_FUNCTION_URL=https://tu-function-url.lambda-url.us-east-1.on.aws/
```

4. Build recomendado:

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

## Notas Operativas

- No hay OCR local en frontend; la extraccion semantica ocurre en Lambda mediante Bedrock.
- El frontend si prepara archivos para reducir tamano antes de enviarlos.
- El JSON de extraccion es visible para evaluacion tecnica cuando el archivo si parece comprobante.
- La validacion de demo se basa principalmente en monto y moneda contra la factura mock.
- En una siguiente fase, el JSON puede enviarse a un API bancario o core interno para validar referencia, cuenta, fecha y conciliacion real.
