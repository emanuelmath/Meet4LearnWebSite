import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import planRoutes from './routes/planRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import courseRoutes from './routes/courseRoutes.js';

// Carga variables de entorno.
dotenv.config();

const app = express();

// Middlewares, para conectar con el frontend en Angular.
app.use(cors());            
app.use(express.json());   


app.get('/', (req, res) => {
  res.send('Meet4Learn, backend activo.');
});

app.use('/plans', planRoutes);
app.use('/profiles', profileRoutes);
app.use('/courses', courseRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server corriendo en el puerto: ${PORT}.`);
});
