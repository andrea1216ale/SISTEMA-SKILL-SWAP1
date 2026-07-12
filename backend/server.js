const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboard.routes');
const profileRoutes = require('./routes/profile.routes');
const searchRoutes = require('./routes/search.routes');
const publicacionRoutes = require('./routes/publicacion.routes');
const intercambioRoutes = require('./routes/intercambio.routes');
const calificacionRoutes = require('./routes/calificacion.routes');
const chatRoutes = require('./routes/chatRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const configureSocket = require('./services/socket.service');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_ORIGIN || '*', methods: ['GET', 'POST', 'PATCH'] }
});
configureSocket(io);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor Skill Swap funcionando');
});

app.use('/api', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', publicacionRoutes);
app.use('/api/intercambios', intercambioRoutes);
app.use('/api/calificaciones', calificacionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 3000;

httpServer.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
