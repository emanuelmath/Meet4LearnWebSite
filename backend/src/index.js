import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Carga variables de entorno.
dotenv.config();

const app = express();

// Middlewares, para conectar con el frontend en Angular.
app.use(cors());            
app.use(express.json());   


app.get('/', (req, res) => {
  res.send('Probando backend...');
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server corriendo en el puerto: ${PORT}.`);
});
