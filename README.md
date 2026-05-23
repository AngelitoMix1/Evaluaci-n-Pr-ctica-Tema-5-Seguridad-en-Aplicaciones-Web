# TaskSync - Gestión de Tareas Colaborativa en Tiempo Real

TaskSync es una aplicación web desarrollada con Node.js y Angular que permite a múltiples usuarios gestionar, crear, editar y eliminar tareas de manera colaborativa, reflejando los cambios al instante en todas las pantallas conectadas.

---

## Instrucciones de Instalación y Ejecución

## Requisitos Previos

- Node.js instalado en tu sistema.
- Angular CLI instalado globalmente:

```bash
npm install -g @angular/cli
```

---

## 1. Levantar el Backend (Servidor Node.js)

Abre una terminal y navega a la carpeta del servidor:

```bash
cd server
```

Instala las dependencias necesarias:

```bash
npm install
```

Inicia el servidor:

```bash
node server.js
```

El servidor estará escuchando y listo en:

```bash
http://localhost:3000
```

---

## 2. Levantar el Frontend (Aplicación Angular)

Abre otra terminal y navega a la carpeta del cliente:

```bash
cd tasksync
```

Instala las dependencias:

```bash
npm install
```

Inicia el servidor de desarrollo de Angular:

```bash
ng serve
```

Abre tu navegador y entra a:

```bash
http://localhost:4200
```

Puedes abrir múltiples ventanas o pestañas de incógnito para probar la interacción multiusuario.

---

## Descripción Técnica: Integración de Axios y Socket.IO

La arquitectura de TaskSync utiliza un modelo híbrido para la comunicación cliente-servidor. Combina peticiones HTTP asíncronas estandarizadas para el manejo de intenciones de usuario, con WebSockets para la actualización reactiva del estado global.

---

## 1. Axios (Operaciones CRUD y Manejo de Errores)

Axios se implementó de forma modularizada dentro de `TaskService`. Actúa como el canal principal para enviar los datos al servidor (intención de creación, edición o borrado).

- **Control de Promesas:** Se aplicaron bloques `try/catch` en la lógica de los componentes.
- **Rollback Visual:** Si Axios detecta una falla en la red o un error del servidor, la aplicación captura la excepción y revierte el estado local.
- **Manejo de Respuestas:** La interfaz solo limpia campos y cierra modos de edición si Axios responde con códigos `200` o `201`.

---

## 2. Socket.IO (Sincronización Bidireccional en Tiempo Real)

Mientras Axios comunica la acción individual, Socket.IO se encarga de la distribución colectiva.

El servidor Node.js escucha las peticiones REST y, tras procesarlas, emite eventos:

- `taskAdded`
- `taskUpdated`
- `taskDeleted`

Estos eventos se envían a todos los sockets conectados.

El cliente Angular, mediante `SocketService`, mantiene suscripciones activas a dichos eventos.

### Actualización del DOM

Para asegurar renderizado inmediato de cambios y notificaciones, se integró:

```typescript
cdr.detectChanges();
```

Forzando un repintado inmediato de la interfaz.

---

## Flujo de Interacción Colaborativa

1. El Usuario A completa una tarea interactuando con el checkbox.
2. Axios envía una petición `PUT` al backend con el nuevo estado.
3. El servidor actualiza datos, responde `200` y emite `taskUpdated`.
4. El Usuario B recibe el evento por Socket.IO.
5. Su pantalla se actualiza sin recargar.
6. Se muestra una notificación indicando quién modificó el tablero.

---


