# README.md — TaskSync Seguro con HTTPS, JWT y WebSockets

##  Descripción General

TaskSync es una aplicación web colaborativa desarrollada con Angular y Node.js que implementa múltiples mecanismos de seguridad orientados a la protección de credenciales, autenticación de usuarios, autorización de recursos y cifrado de comunicaciones.

La arquitectura integra:

- Backend REST seguro con Express.
- Autenticación basada en JWT.
- Hash de contraseñas con BcryptJS.
- Comunicación en tiempo real con Socket.IO.
- HTTPS con certificados SSL/TLS autofirmados.
- Protección de endpoints mediante middlewares.
- Manejo seguro de sesiones desde Angular.

---

#  Requisitos Previos

Antes de ejecutar el proyecto asegúrate de tener instalado:

- Node.js
- Angular CLI

Verificar instalación:

```bash
node -v
npm -v
ng version
```

---

#  1. Generación de Certificados SSL/TLS

Ubícate dentro de la carpeta del servidor y ejecuta:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.cert
```

## Datos sugeridos durante la configuración

| Campo | Valor |
|---|---|
| Country Name | MX |
| State or Province | Hidalgo |
| Locality Name | Pachuca |
| Organization Name | ITP |
| Common Name | localhost |

 Importante:  
Cuando OpenSSL solicite:

```bash
Common Name (e.g. server FQDN)
```

debes escribir exactamente:

```bash
localhost
```

---

#  2. Configuración y Ejecución del Backend (Node.js)

## Entrar a la carpeta del servidor

```bash
cd server
```

## Instalar dependencias

```bash
npm install
```

## Ejecutar el servidor HTTPS

```bash
node server.js
```

## Mensaje esperado en consola

```bash
 Servidor SEGURO ejecutándose exclusivamente bajo HTTPS en el puerto 3000.
```

---

#  3. Configuración y Ejecución del Frontend (Angular)

Abrir una nueva terminal y navegar al proyecto Angular:

```bash
cd tasksync
```

## Instalar dependencias

```bash
npm install
```

## Iniciar Angular

```bash
ng serve
```

## URL de acceso

```text
http://localhost:4200
```

---

#  4. Configuración Inicial del Navegador (Paso Obligatorio)

Debido a que el certificado SSL es autofirmado, los navegadores bloquearán inicialmente las peticiones HTTPS hasta otorgar permisos manualmente.

## Pasos

1. Abrir directamente:

```text
https://localhost:3000/tasks
```

2. Aparecerá la advertencia:

```text
"La conexión no es privada"
```

3. Seleccionar:

```text
Configuración avanzada
```

4. Después hacer clic en:

```text
Continuar a localhost (no seguro)
```

5. Se mostrará una respuesta JSON similar a:

```json
{"message":"Acceso denegado. Token requerido."}
```

Esto confirma que:

- HTTPS funciona correctamente.
- El middleware JWT protege la ruta.
- El navegador ya aceptó el certificado.

6. Finalmente abrir:

```text
http://localhost:4200
```

y utilizar la aplicación normalmente.

---

#  Descripción Técnica de la Seguridad Implementada

La arquitectura de seguridad implementa protección multicapa siguiendo principios de defensa en profundidad.

---

# 1. Protección de Credenciales

## Hash de Contraseñas con BcryptJS

Las contraseñas nunca se almacenan en texto plano.

Durante el registro:

- El backend genera un hash criptográfico.
- Se utiliza BcryptJS con:

```js
saltRounds = 10
```

## Beneficios

- Protección contra ataques de diccionario.
- Mitigación de rainbow tables.
- Mayor costo computacional para fuerza bruta.

---

# 2. Autenticación y Gestión de Sesiones

## JSON Web Tokens (JWT)

Tras iniciar sesión correctamente:

- El servidor genera un JWT firmado con HMAC SHA256.
- El token contiene expiración automática:

```js
expiresIn: '1h'
```

## Almacenamiento Seguro

El frontend almacena el token en:

```js
sessionStorage
```

Esto garantiza:

- Eliminación automática al cerrar pestaña.
- Menor persistencia que localStorage.
- Reducción de exposición ante robo de sesión.

---

# 3. Protección de Endpoints REST

Se desarrolló el middleware:

```js
authenticateJWT
```

El middleware protege:

| Método | Endpoint |
|---|---|
| GET | /tasks |
| POST | /tasks |
| PUT | /tasks/:id |
| DELETE | /tasks/:id |

## Validaciones realizadas

- Existencia del token.
- Formato Bearer válido.
- Firma JWT auténtica.
- Expiración del token.

## Respuestas de seguridad

| Código | Significado |
|---|---|
| 401 | Unauthorized |
| 403 | Forbidden |

---

# 4. Manejo Seguro desde Angular

El frontend utiliza Axios para enviar automáticamente:

```http
Authorization: Bearer <JWT>
```

en cada petición protegida.

Además:

- Angular detecta errores 401/403.
- El sistema ejecuta logout forzado.
- El usuario regresa automáticamente al login.

---

# 5. Seguridad en Tiempo Real (Socket.IO)

La seguridad también fue aplicada a WebSockets.

## Middleware de Handshake

Antes de permitir conexiones Socket.IO:

- El servidor valida:

```js
socket.handshake.auth.token
```

## Beneficios

- Solo usuarios autenticados reciben eventos.
- Se bloquea la inyección de sockets falsos.
- Protección de eventos colaborativos en tiempo real.

---

#  6. Seguridad HTTPS y SSL/TLS

El backend opera exclusivamente sobre HTTPS utilizando:

- Certificados SSL/TLS autofirmados.
- `https.createServer()`
- Cifrado de transporte.

## Beneficios

### Cifrado de datos en tránsito

Evita:

- Sniffing.
- Intercepción de tráfico.
- Ataques MITM.

### Protección de credenciales

Los formularios de login y registro viajan cifrados.

### Protección de JWT

Los tokens no pueden visualizarse en texto plano durante la transmisión.

### Seguridad en WebSockets

Socket.IO hereda automáticamente cifrado WSS:

```text
ws:// → wss://
```

---

# Justificación de la Opción Seleccionada

## Opción B — HTTPS con Certificados SSL/TLS

Se eligió la Opción B debido a que HTTPS representa la capa crítica de protección para aplicaciones modernas basadas en autenticación por tokens.

## Razones técnicas

### 1. Protección contra ataques MITM

Sin HTTPS:

- Los JWT viajarían en texto plano.
- Un atacante podría robar sesiones fácilmente.

Con HTTPS:

- Todo el tráfico viaja cifrado.
- Los datos son ilegibles para terceros.

---

### 2. Protección de formularios sensibles

Las credenciales de usuario:

- Viajan cifradas desde Angular.
- Son protegidas antes de llegar al backend.

---

### 3. Integración segura con Socket.IO

Al utilizar:

```js
https.createServer()
```

Socket.IO opera automáticamente mediante:

```text
WSS (WebSocket Secure)
```

Esto garantiza:

- Confidencialidad.
- Integridad.
- Privacidad en tiempo real.

---

#  Estructura General del Proyecto

```text

project/
│
├── server/
│   ├── server.js
│   ├── server.key
│   ├── server.cert
│   └── package.json
│
├── tasksync/
│   ├── src/
│   ├── angular.json
│   └── package.json
│
└── README.md
```

---

# Tecnologías Utilizadas

## Backend

- Node.js
- Express
- HTTPS
- Socket.IO
- JSON Web Token
- BcryptJS

## Frontend

- Angular
- Axios
- TypeScript

---

