# Integración de pagos: PayPal + Mercado Pago

## Qué ya quedó incluido
- Backend con endpoints para listar y registrar pagos.
- Checkout con dos proveedores: PayPal y Mercado Pago.
- Webhook para Mercado Pago.
- Webhook para PayPal.
- Componentes frontend para pagar con ambas pasarelas.
- Compatibilidad con el endpoint anterior `POST /api/pagos/iniciar` para Mercado Pago.

## Instalar dependencias
### Backend
```bash
cd Backend
npm install
```

### Frontend
```bash
cd Frontend
npm install
```

## Variables de entorno
1. Copia `Backend/.env.example` a `Backend/.env`
2. Copia `Frontend/.env.example` a `Frontend/.env`
3. Rellena tus credenciales reales de PayPal y Mercado Pago.

## SQL necesario
Ejecuta este bloque en tu base de datos si la tabla `pagos` todavía no tiene estos campos:

```sql
ALTER TABLE pagos
ADD COLUMN proveedor_pago ENUM('mercadopago','paypal') NULL,
ADD COLUMN external_reference VARCHAR(100) NULL,
ADD COLUMN mp_preference_id VARCHAR(100) NULL,
ADD COLUMN mp_payment_id VARCHAR(100) NULL,
ADD COLUMN paypal_order_id VARCHAR(100) NULL,
ADD COLUMN paypal_capture_id VARCHAR(100) NULL,
ADD COLUMN pagado_en DATETIME NULL;
```

## Endpoints nuevos
- `GET /api/pagos`
- `POST /api/pagos`
- `POST /api/pagos/create-checkout`
- `POST /api/pagos/paypal/capture-order`
- `POST /api/webhooks/mercadopago`
- `POST /api/webhooks/paypal`

## Cómo arrancar
### Backend
```bash
cd Backend
npm run dev
```

### Frontend
```bash
cd Frontend
npm run dev
```

## Qué tienes que configurar afuera del código
### Mercado Pago
- Crear tu app en Mercado Pago Developers.
- Colocar `MP_ACCESS_TOKEN`.
- Configurar el webhook a `/api/webhooks/mercadopago`.

### PayPal
- Crear tu app REST en PayPal Developer.
- Colocar `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`.
- Crear y guardar el `PAYPAL_WEBHOOK_ID`.
- Configurar el webhook a `/api/webhooks/paypal`.
- Suscribir el evento `PAYMENT.CAPTURE.COMPLETED`.

## Nota importante
Para pruebas locales, si PayPal o Mercado Pago necesitan una URL pública para el webhook, usa ngrok o Cloudflare Tunnel y reemplaza las URLs locales por tu URL pública HTTPS.
