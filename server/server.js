const express = require('express');
const https = require('https'); 
const fs = require('fs');       
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

//  CONFIGURACIÓN SSL/TLS (Opción B)
const sslOptions = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
};

const server = https.createServer(sslOptions, app);
const io = new Server(server, {
    cors: { origin: '*' }
});

const JWT_SECRET = 'super_secret_key_tasksync_2026';

// Persistencia en memoria
let users = [];
let tasks = [];
let currentId = 1;

// ==========================================
//  MIDDLEWARES DE SEGURIDAD (JWT)
// ==========================================

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acceso denegado. Token requerido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
};

io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Autenticación fallida. Token requerido.'));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded; 
        next();
    } catch (err) {
        next(new Error('Token inválido o expirado. Conexión rechazada.'));
    }
});

// ==========================================
// ENDPOINTS DE AUTENTICACIÓN
// ==========================================

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Campos requeridos incompletos.' });
    }

    const userExists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
        return res.status(400).json({ message: 'El usuario ya existe.' });
    }

    try {
        // Encriptación de la contraseña con bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ username, password: hashedPassword });

               console.log('\n--- EVIDENCIA BCRYPT (Base de Datos en Memoria) ---');
        console.log(users);
        console.log('---------------------------------------------------\n');

        res.status(201).json({ message: 'Usuario registrado con éxito.' });
    } catch (error) {
        res.status(500).json({ message: 'Error interno en el servidor.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
        return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username: user.username });
});

// ==========================================
// 📝 ENDPOINTS CRUD (PROTEGIDOS CON HTTPS + JWT)
// ==========================================

app.get('/tasks', authenticateJWT, (req, res) => {
    res.json(tasks);
});

app.post('/tasks', authenticateJWT, (req, res) => {
    const { title, username } = req.body;
    const task = { id: currentId++, title, completed: false };
    tasks.push(task);
    
    io.emit('taskAdded', { task, username });
    res.status(201).json(task);
});

app.put('/tasks/:id', authenticateJWT, (req, res) => {
    const id = parseInt(req.params.id);
    const { username, ...updateData } = req.body;
    const index = tasks.findIndex(t => t.id === id);
    
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updateData };
        io.emit('taskUpdated', { task: tasks[index], username });
        res.json(tasks[index]);
    } else {
        res.status(404).json({ message: 'Tarea no encontrada' });
    }
});

app.delete('/tasks/:id', authenticateJWT, (req, res) => {
    const id = parseInt(req.params.id);
    const username = req.query.username || 'Alguien';
    tasks = tasks.filter(t => t.id !== id);
    
    io.emit('taskDeleted', { id, username });
    res.status(204).send();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(` Servidor SEGURO ejecutándose exclusivamente bajo HTTPS en el puerto ${PORT}`);
});