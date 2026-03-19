# API Reference

Base URL: `http://localhost/api/v1` (via Nginx) or `http://localhost:8000/api/v1` (direct)

Interactive docs: `http://localhost:8000/docs` (Swagger UI)

## Authentication

All endpoints except `/health` and `/catalogos/*` require a Bearer token:

```
Authorization: Bearer <supabase-jwt>
```

The JWT is obtained from Supabase Auth on login and refreshed automatically by the frontend.

---

## Health

### `GET /health`
Returns service liveness status.

**Response 200:**
```json
{ "status": "ok" }
```

---

## Catalogos (public, no auth required)

### `GET /catalogos/monedas`
List all active currencies.

**Response 200:**
```json
[
  { "codigo": "DOP", "nombre": "Peso Dominicano", "simbolo": "RD$", "activa": true },
  { "codigo": "USD", "nombre": "Dólar Estadounidense", "simbolo": "$", "activa": true }
]
```

### `GET /catalogos/paises`
List all active countries with their currency.

**Response 200:**
```json
[
  {
    "codigo": "DO",
    "nombre": "República Dominicana",
    "moneda_codigo": "DOP",
    "activo": true,
    "monedas": { "codigo": "DOP", "nombre": "Peso Dominicano", "simbolo": "RD$", "activa": true }
  }
]
```

### `GET /catalogos/paises/{codigo}/bancos`
List banks for a country. `codigo` is case-insensitive (e.g., `DO` or `do`).

**Response 200:**
```json
[
  { "id": "uuid", "nombre": "Banco Popular Dominicano", "pais_codigo": "DO", "activo": true }
]
```

---

## Categorias

### `GET /categorias`
List user's categories.

### `POST /categorias`
Create a category.

**Body:**
```json
{ "nombre": "Restaurantes", "tipo": "egreso", "icono": "🍕", "color": "#FF5733" }
```

### `PUT /categorias/{id}`
Update a category.

### `DELETE /categorias/{id}`
Delete a category.

---

## Ingresos

### `GET /ingresos`
List income records. Optional query params: `mes`, `year`, `categoria_id`.

### `POST /ingresos`
Create an income record.

**Body:**
```json
{
  "monto": 50000.00,
  "descripcion": "Salario enero",
  "fecha": "2026-01-31",
  "categoria_id": "uuid",
  "moneda": "DOP",
  "notas": null
}
```

### `PUT /ingresos/{id}`
Update an income record.

### `DELETE /ingresos/{id}`
Delete an income record.

---

## Egresos

### `GET /egresos`
List expense records. Optional query params: `mes`, `year`, `categoria_id`.

### `POST /egresos`
Create an expense record.

**Body:**
```json
{
  "monto": 1500.00,
  "descripcion": "Supermercado",
  "fecha": "2026-01-15",
  "categoria_id": "uuid",
  "moneda": "DOP",
  "notas": null
}
```

### `PUT /egresos/{id}`
Update an expense record.

### `DELETE /egresos/{id}`
Delete an expense record.

---

## Dashboard

### `GET /dashboard`
Returns aggregated stats for the dashboard. Query params: `mes`, `year`.

**Response 200:**
```json
{
  "total_ingresos": 85000.00,
  "total_egresos": 42300.00,
  "balance": 42700.00,
  "top_categorias": [...],
  "ingresos_recientes": [...],
  "egresos_recientes": [...],
  "comparacion_mes_anterior": { "ingresos_delta": 5.2, "egresos_delta": -3.1 }
}
```

---

## Tarjetas

### `GET /tarjetas`
List user's credit/debit cards.

### `POST /tarjetas`
Create a card.

**Body:**
```json
{
  "banco": "Banco Popular Dominicano",
  "banco_id": "uuid-from-catalog",
  "banco_custom": null,
  "titular": "Juan Pérez",
  "ultimos_digitos": "4521",
  "tipo": "credito",
  "red": "visa",
  "limite_credito": 100000.00,
  "saldo_actual": 25000.00,
  "fecha_corte": 15,
  "fecha_pago": 25,
  "color": "#1a2b3c",
  "activa": true
}
```

**`tipo`:** `"credito"` | `"debito"`
**`red`:** `"visa"` | `"mastercard"` | `"amex"` | `"discover"` | `"otro"`

### `PUT /tarjetas/{id}`
Update a card.

### `DELETE /tarjetas/{id}`
Delete a card.

### `GET /tarjetas/{id}/movimientos`
List card transactions.

### `POST /tarjetas/{id}/movimientos`
Add a card transaction (purchase or payment).

**Body:**
```json
{
  "tipo": "compra",
  "monto": 3500.00,
  "descripcion": "Restaurante",
  "fecha": "2026-01-20",
  "categoria_id": "uuid",
  "notas": null
}
```

**`tipo`:** `"compra"` | `"pago"`

---

## Préstamos

### `GET /prestamos`
List loans. Returns both `me_deben` (owed to user) and `yo_debo` (user owes).

### `POST /prestamos`
Create a loan.

**Body:**
```json
{
  "tipo": "me_deben",
  "persona": "Carlos",
  "monto": 5000.00,
  "moneda": "DOP",
  "fecha_prestamo": "2026-01-01",
  "fecha_vencimiento": "2026-03-01",
  "descripcion": "Préstamo personal",
  "tasa_interes": 0.0,
  "notas": null
}
```

### `PUT /prestamos/{id}`
Update a loan.

### `DELETE /prestamos/{id}`
Delete a loan.

### `POST /prestamos/{id}/pagos`
Register a payment on a loan.

---

## Metas

### `GET /metas`
List savings goals.

### `POST /metas`
Create a savings goal.

**Body:**
```json
{
  "nombre": "Vacaciones",
  "monto_objetivo": 50000.00,
  "monto_actual": 10000.00,
  "fecha_objetivo": "2026-12-31",
  "icono": "✈️",
  "color": "#4CAF50"
}
```

### `PUT /metas/{id}`
Update a goal.

### `DELETE /metas/{id}`
Delete a goal.

### `POST /metas/{id}/contribuciones`
Add a contribution to a goal.

---

## Presupuestos

### `GET /presupuestos`
List monthly budgets. Query params: `mes`, `year`.

### `GET /presupuestos/estado`
Returns budget usage status (amount used vs. limit per category).

### `POST /presupuestos`
Create a budget.

**Body:**
```json
{
  "categoria_id": "uuid",
  "monto": 15000.00,
  "mes": 1,
  "year": 2026,
  "aplicar_todos_los_meses": false
}
```

### `PUT /presupuestos/{id}`
Update a budget.

### `DELETE /presupuestos/{id}`
Delete a budget.

---

## Recurrentes

### `GET /recurrentes`
List recurring transactions.

### `POST /recurrentes`
Create a recurring transaction.

**Body:**
```json
{
  "nombre": "Netflix",
  "monto": 750.00,
  "tipo": "egreso",
  "frecuencia": "mensual",
  "fecha_inicio": "2026-01-01",
  "categoria_id": "uuid",
  "moneda": "DOP"
}
```

### `PUT /recurrentes/{id}`
Update a recurring transaction.

### `DELETE /recurrentes/{id}`
Delete a recurring transaction.

---

## Fondo de Emergencia

### `GET /fondo-emergencia`
Get the emergency fund status.

### `POST /fondo-emergencia`
Initialize or update the emergency fund target.

### `POST /fondo-emergencia/depositos`
Add a deposit to the emergency fund.

### `POST /fondo-emergencia/retiros`
Register a withdrawal from the emergency fund.

---

## Suscripciones

### `GET /suscripciones`
List subscriptions.

### `POST /suscripciones`
Create a subscription.

### `PUT /suscripciones/{id}`
Update a subscription.

### `DELETE /suscripciones/{id}`
Delete a subscription.

---

## Retos

### `GET /retos`
List available and active challenges.

### `POST /retos/{id}/iniciar`
Start a challenge.

### `POST /retos/{id}/progreso`
Update progress on a challenge.

---

## Educacion

### `GET /educacion/lecciones`
List financial education lessons.

### `GET /educacion/lecciones/{id}`
Get lesson detail.

### `POST /educacion/lecciones/{id}/completar`
Mark a lesson as completed.

---

## Impulso

### `GET /impulso`
List impulse purchase records.

### `POST /impulso`
Register an impulse purchase evaluation.

### `PUT /impulso/{id}`
Update impulse purchase decision.

---

## Notificaciones

### `GET /notificaciones`
List notifications for the user.

### `PUT /notificaciones/{id}/leer`
Mark a notification as read.

### `PUT /notificaciones/leer-todas`
Mark all notifications as read.

---

## Score

### `GET /score`
Get the user's financial health score and breakdown.

---

## Prediccion

### `GET /prediccion`
Get the predicted expenses for the current/next month.

---

## Comparativa

### `GET /comparativa`
Get period-over-period comparison. Query params: `periodo` (`mensual` | `trimestral` | `anual`).

---

## Profiles

### `GET /profiles/me`
Get the current user's profile.

### `PUT /profiles/me`
Update profile (name, country, currency preference, onboarding status).

---

## Error Responses

All errors follow:

```json
{ "detail": "Error description" }
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error / bad request |
| 401 | Missing or invalid JWT |
| 403 | Forbidden (resource belongs to another user) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Pydantic validation failed |
| 500 | Internal server error |
