# Presupuesta mi web · API de presupuestos

**0613 · Desarrollo web en entorno servidor** — Actividad individual

API REST hecha con **Node.js + Express (JavaScript)** que recibe las características de una web, valida los datos y devuelve un presupuesto desglosado calculado **solo con las tarifas del servidor**.

> La API está en la carpeta [`server/`](server/). La raíz del repositorio contiene la interfaz web opcional (ampliación).

---

## Requisitos

- **Node.js 20 o superior** (probado con Node 25.9) y **npm**
- No necesita base de datos ni variables de entorno

## Instalación y ejecución

```bash
git clone <URL-de-este-repositorio>
cd <carpeta-del-repositorio>/server
npm install
npm start
```

En la consola aparecerá:

```
API de presupuestos escuchando en http://localhost:3000
```

| Comando       | Qué hace                                                        |
| ------------- | --------------------------------------------------------------- |
| `npm start`   | Arranca la API                                                  |
| `npm run dev` | Arranca la API y la reinicia al guardar cambios (`node --watch`) |
| `npm test`    | Ejecuta las pruebas automáticas (`node:test`)                   |

### Puerto

Por defecto **3000**. Para usar otro, define la variable `PORT`:

```bash
PORT=4000 npm start              # Linux / macOS / Git Bash
$env:PORT=4000; npm start        # Windows PowerShell
```

---

## Rutas

| Método | Ruta               | Descripción                                   |
| ------ | ------------------ | --------------------------------------------- |
| GET    | `/api/estado`      | Comprueba que el servicio funciona            |
| GET    | `/api/tarifas`     | Devuelve las tarifas que aplica el servidor   |
| POST   | `/api/presupuesto` | Valida la solicitud y calcula el presupuesto  |

### `GET /api/estado`

```json
{ "status": "ok" }
```

### `GET /api/tarifas`

```json
{
  "landing": 300,
  "corporativa": 600,
  "paginaAdicional": 50,
  "formulario": 80,
  "segundoIdioma": 150,
  "moneda": "EUR"
}
```

`landing` y `corporativa` incluyen la primera página. `paginaAdicional` se cobra por cada página a partir de la segunda.

### `POST /api/presupuesto`

Cabecera obligatoria: `Content-Type: application/json`

**Cuerpo (los cuatro campos son obligatorios):**

| Campo           | Tipo     | Valores admitidos              |
| --------------- | -------- | ------------------------------ |
| `tipo`          | string   | `"landing"` o `"corporativa"`  |
| `paginas`       | number   | entero entre 1 y 20            |
| `formulario`    | boolean  | `true` o `false`               |
| `segundoIdioma` | boolean  | `true` o `false`               |

Las propiedades adicionales se ignoran: aunque el cliente envíe `total`, `base` o cualquier tarifa, el servidor no las usa.

**Respuesta 200:**

```json
{
  "base": 600,
  "paginasAdicionales": 150,
  "formulario": 80,
  "segundoIdioma": 0,
  "total": 830,
  "moneda": "EUR"
}
```

**Respuesta 400** (la solicitud incumple el contrato; no se calcula nada):

```json
{
  "error": "Solicitud no válida",
  "campos": ["paginas"],
  "detalles": ["'paginas' debe ser un número entero entre 1 y 20"]
}
```

| Estado | Significado                                                        |
| ------ | ------------------------------------------------------------------ |
| 200    | Cálculo realizado correctamente                                    |
| 400    | Solicitud inválida: campo ausente, tipo incorrecto, fuera de rango o JSON mal formado |
| 404    | Ruta inexistente                                                   |
| 500    | Fallo interno inesperado                                           |

---

## Cómo probarla

Con el servidor arrancado, desde **Git Bash, Linux o macOS**:

```bash
curl -i http://localhost:3000/api/estado
curl -i http://localhost:3000/api/tarifas

curl -i http://localhost:3000/api/presupuesto \
  -H "Content-Type: application/json" \
  -d '{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}'
```

Desde **Windows PowerShell** (allí `curl` es un alias de otro comando):

```powershell
Invoke-RestMethod http://localhost:3000/api/presupuesto -Method Post `
  -ContentType "application/json" `
  -Body '{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}'
```

También se puede usar Postman, Thunder Client o la extensión REST Client de VS Code.

> Abrir `/api/presupuesto` en la barra del navegador **no** sirve: el navegador envía GET, no un POST con JSON.

### Pruebas automáticas

```bash
cd server
npm test
```

Lanzan las tres rutas y los nueve casos de la tabla, además de comprobaciones extra. Resultado: **14 pruebas, 14 superadas**.

---

## Tabla de pruebas

En los casos inválidos solo cambia un campo respecto a la solicitud válida `{"tipo":"landing","paginas":1,"formulario":false,"segundoIdioma":false}`. Así cada error se comprueba por separado.

### Rutas GET

| Petición            | Esperado                    | Obtenido                                                                                              | ✔ |
| ------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------- | - |
| `GET /api/estado`   | 200 · `{"status":"ok"}`     | 200 · `{"status":"ok"}`                                                                               | ✅ |
| `GET /api/tarifas`  | 200 · las cinco tarifas     | 200 · `{"landing":300,"corporativa":600,"paginaAdicional":50,"formulario":80,"segundoIdioma":150,"moneda":"EUR"}` | ✅ |

### `POST /api/presupuesto`

| # | Solicitud enviada | Esperado | Obtenido | ✔ |
| - | ----------------- | -------- | -------- | - |
| 1 | `{"tipo":"landing","paginas":1,"formulario":false,"segundoIdioma":false}` | 200 · total 300 € | 200 · `{"base":300,"paginasAdicionales":0,"formulario":0,"segundoIdioma":0,"total":300,"moneda":"EUR"}` | ✅ |
| 2 | `{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}` | 200 · total 830 € | 200 · `{"base":600,"paginasAdicionales":150,"formulario":80,"segundoIdioma":0,"total":830,"moneda":"EUR"}` | ✅ |
| 3 | `{"tipo":"landing","paginas":2,"formulario":true,"segundoIdioma":true}` | 200 · total 580 € | 200 · `{"base":300,"paginasAdicionales":50,"formulario":80,"segundoIdioma":150,"total":580,"moneda":"EUR"}` | ✅ |
| 4 | `{"tipo":"landing","paginas":20,"formulario":false,"segundoIdioma":false}` | 200 · total 1.250 € | 200 · `{"base":300,"paginasAdicionales":950,"formulario":0,"segundoIdioma":0,"total":1250,"moneda":"EUR"}` | ✅ |
| 5 | `{"tipo":"landing","paginas":0,"formulario":false,"segundoIdioma":false}` | 400 | 400 · `campos: ["paginas"]` · "'paginas' debe ser un número entero entre 1 y 20" | ✅ |
| 6 | `{"tipo":"landing","paginas":21,"formulario":false,"segundoIdioma":false}` | 400 | 400 · `campos: ["paginas"]` · "'paginas' debe ser un número entero entre 1 y 20" | ✅ |
| 7 | `{"tipo":"landing","paginas":2.5,"formulario":false,"segundoIdioma":false}` | 400 | 400 · `campos: ["paginas"]` · "'paginas' debe ser un número entero entre 1 y 20" | ✅ |
| 8 | `{"tipo":"tienda","paginas":1,"formulario":false,"segundoIdioma":false}` | 400 | 400 · `campos: ["tipo"]` · "'tipo' debe ser uno de: landing, corporativa" | ✅ |
| 9 | `{"tipo":"landing","paginas":1,"formulario":"false","segundoIdioma":false}` | 400 | 400 · `campos: ["formulario"]` · "'formulario' debe ser un booleano (true o false), no \"false\"" | ✅ |

### Pruebas adicionales

| Solicitud enviada | Esperado | Obtenido | ✔ |
| ----------------- | -------- | -------- | - |
| `paginas: "4"` (cadena) | 400 | 400 · `campos: ["paginas"]` | ✅ |
| Sin el campo `segundoIdioma` | 400 | 400 · `campos: ["segundoIdioma"]` | ✅ |
| JSON mal formado: `{"tipo":"landing",` | 400 | 400 · "El cuerpo no es un JSON válido" | ✅ |
| Sin cabecera `Content-Type: application/json` | 400 | 400 · "El cuerpo debe ser un objeto JSON enviado con Content-Type: application/json" | ✅ |
| Solicitud del caso 1 + `"total":1,"base":1,"landing":1` | 200 · total 300 € (se ignoran) | 200 · total 300 € | ✅ |

---

## Organización del código

```
server/
├── package.json          ← dependencias (express) y scripts: start, dev, test
├── package-lock.json     ← versiones exactas instaladas
├── src/
│   ├── index.js          ← arranca el servidor en el puerto configurado
│   ├── app.js            ← rutas Express: interpretan la petición y responden
│   ├── tarifas.js        ← constantes de tarifas (solo viven en el servidor)
│   ├── validacion.js     ← validarSolicitud(): comprueba el contrato
│   └── presupuesto.js    ← calcularPresupuesto(): lógica de negocio, sin Express
└── test/
    └── api.test.js       ← pruebas automáticas de las rutas y los 9 casos
```

Cada pieza tiene una sola responsabilidad:

1. **La ruta** (`app.js`) recibe la petición, llama a la validación y decide el estado HTTP.
2. **La validación** (`validacion.js`) comprueba los datos y devuelve solo los cuatro campos del contrato.
3. **La función de cálculo** (`presupuesto.js`) recibe datos ya validados y aplica las tarifas. No conoce `req` ni `res`.

### Ejemplo de validación: `paginas`

```js
!Number.isInteger(paginas) || paginas < 1 || paginas > 20
```

`Number.isInteger` devuelve `false` para `2.5` (decimal), para `"4"` (cadena, no número) y para `NaN`. Después se comprueba el rango 1–20. Si falla, la ruta responde **400** sin llegar a calcular.

### Ejemplo de cálculo: caso 2 (corporativa, 4 páginas, formulario)

| Concepto              | Regla                 | Importe   |
| --------------------- | --------------------- | --------- |
| Base                  | `TARIFAS.corporativa` | 600 €     |
| Páginas adicionales   | `(4 − 1) × 50`        | 150 €     |
| Formulario            | elegido → 80          | 80 €      |
| Segundo idioma        | no elegido → 0        | 0 €       |
| **Total**             |                       | **830 €** |
