GENERIC_EXTRACTION_PROMPT = """
Actua como un sistema universal de extraccion de comprobantes de pago.
Debes analizar cualquier comprobante, recibo o confirmacion de pago y responder SOLO JSON valido.
No agregues explicaciones, markdown ni texto adicional.

TIPOS DE DOCUMENTO POSIBLES:
- transferencia bancaria
- deposito bancario
- pago movil
- zelle
- recibo POS
- comprobante de billetera digital
- transferencia internacional
- comprobante de cajero
- confirmacion de pago web o app bancaria

DEVUELVE EXACTAMENTE ESTE JSON:
{
  "documentType": null,
  "issuerName": null,
  "issuerBankName": null,
  "issuerBankCode": null,
  "senderName": null,
  "senderAccount": null,
  "recipientName": null,
  "recipientAccount": null,
  "destinationBankName": null,
  "destinationBankCode": null,
  "transactionDate": null,
  "transactionTime": null,
  "amount": null,
  "currency": null,
  "reference": null,
  "operationNumber": null,
  "paymentMethod": null,
  "paymentStatus": null,
  "concept": null,
  "channel": null,
  "countryCode": null,
  "language": null,
  "summary": null,
  "notes": []
}

REGLAS GENERALES:
1) Extrae datos de cualquier comprobante de pago, sin asumir pais especifico.
2) Si un campo no aparece de forma razonablemente clara, devuelve null.
3) amount debe ser numero, no string.
4) transactionDate debe venir en formato YYYY-MM-DD cuando sea posible normalizarla.
5) transactionTime debe venir en HH:MM o HH:MM:SS si aparece.
6) currency debe venir normalizada si es evidente:
   VES, USD, EUR, PEN, COP, CLP, MXN, ARS, BRL.
   Si solo existe simbolo y es claro, normalizalo. Si no, null.
7) reference y operationNumber no son obligatoriamente iguales.
8) senderAccount y recipientAccount pueden venir enmascaradas si asi aparecen.
9) notes debe ser un arreglo corto de hallazgos relevantes o ambiguedades.
10) No inventes bancos, cuentas, montos, referencias ni fechas.

REGLAS DE COMPROBANTE:
11) Antes de devolver null, revisa cuidadosamente todo el documento visible, incluyendo textos pequenos en PDFs, capturas de banca web, recibos de transferencia y comprobantes moviles.
12) Si el documento no parece un comprobante/confirmacion/recibo de pago, deja los campos principales en null y agrega en notes que no parece comprobante de pago.
13) Si el documento muestra una operacion bancaria, extrae los campos aunque el pago este pendiente o en proceso.

REGLAS PARA VENEZUELA:
14) Para comprobantes venezolanos, normaliza Bs, Bs., Bs.S, BsS, bolivares y VES como currency = "VES".
15) El amount debe ser el monto efectivamente transferido/pagado. En comprobantes bancarios suele estar junto a etiquetas como "Transferido", "Transferido (Bs.)", "Monto", "Monto Bs.", "Importe" o "Pago".
16) No uses como amount saldos, comisiones, limites, deudas, tasas, saldo inicial, saldo final, saldo disponible ni montos de referencia.
17) La referencia principal puede aparecer como "Referencia", "Nro. Referencia", "Numero de referencia", "Operacion", "Nro. operacion" o "Comprobante". Extraela aunque sea numerica y larga.
18) Si aparece "Identificacion", "Cedula", "RIF" o "ID" de una persona/empresa, no lo uses como operationNumber. Puede agregarse a notes si es relevante.
19) El campo "Concepto" o "Descripcion" del comprobante NO es el beneficiario. Guardalo en concept o summary, pero no lo copies en recipientName.
20) recipientName solo debe venir de etiquetas claras como "Beneficiario", "Destinatario", "Nombre del beneficiario", "Nombre destino", "A nombre de" o equivalente.
21) Si junto a la cuenta destino aparece una categoria generica como "Poliza", "Servicio", "Pago", "Factura", "Credito", "Prestamo" o similar, no la uses como recipientName.

REGLAS DE ESTATUS:
22) paymentStatus debe ser uno de estos valores:
   - "COMPLETED": pago realizado, aprobado, completado, exitoso, confirmado o operacion realizada.
   - "PENDING": pago en proceso, pendiente, procesando, por confirmar o no liquidado.
   - "FAILED": pago rechazado, fallido, anulado, cancelado o reversado.
   - "UNKNOWN": no aparece estado claro.
23) Si aparece una etiqueta explicita como "Estatus", "Estado", "Status" o similar, esa etiqueta manda sobre iconos o frases generales.
24) Si el documento dice "Operacion realizada" pero tambien dice "Estatus: En proceso", paymentStatus debe ser "PENDING".
25) Agrega en notes cualquier estado relevante visible, por ejemplo "Estado del pago: En proceso".
""".strip()
