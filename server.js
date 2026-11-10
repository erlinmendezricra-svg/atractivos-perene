const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3');
const os = require('os'); // ← agregado para detectar tu IP automáticamente

const app = express();
const PUERTO = 3000;

// ✅ CONEXIÓN CORRECTA A TU BASE DE DATOS
const db = new sqlite3.Database(path.join(__dirname, 'turismo.db'), (err) => {
  if (err) {
    console.error('❌ Error conectando a BD:', err.message);
  } else {
    console.log('✅ Conectado a turismo.db');
  }
});

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// 1️⃣ Lista de atractivos
app.get('/api/atractivos', (req, res) => {
  db.all('SELECT * FROM atractivos', (err, filas) => {
    if (err) return res.status(500).json({ error: err.message });
    const excluir = ['Corona', 'Estatua', 'Parque Perené', 'PARK-PERENÉ'];
    res.json(filas.filter(lugar => !excluir.includes(lugar.nombre)));
  });
});

// 2️⃣ UN SOLO ATRACTIVO
app.get('/api/lugar/:id', (req, res) => {
  const { id } = req.params;
  console.log('🔍 Buscando ID:', id);

  db.get('SELECT * FROM atractivos WHERE id_lugar = ?', [id], (err, lugar) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!lugar) {
      console.log('⚠️ No existe el atractivo con ID:', id);
      return res.status(404).json({ error: 'Atractivo no encontrado' });
    }
    console.log('✅ Encontrado:', lugar.nombre);
    res.json(lugar);
  });
});

// 3️⃣ Generar QR — CORREGIDO para que funcione en celular
app.get('/api/qr/:id', (req, res) => {
  const { id } = req.params;
  
  // Detectar IP automáticamente
  let miIP = 'localhost';
  for (const nombre in os.networkInterfaces()) {
    for (const iface of os.networkInterfaces()[nombre]) {
      if (!iface.internal && iface.family === 'IPv4') {
        miIP = iface.address;
        break;
      }
    }
  }
  
  const urlRa = `http://${miIP}:${PUERTO}/ra/${id}`;
  console.log('📷 QR para:', urlRa);
  res.redirect(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(urlRa)}`);
});

// 4️⃣ Páginas
app.get('/lugar/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lugar.html'));
});

app.get('/ra/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ra.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Iniciar servidor accesible desde celular
app.listen(PUERTO, '0.0.0.0', () => {
  let miIP = '127.0.0.1';
  for (const nombre in os.networkInterfaces()) {
    for (const iface of os.networkInterfaces()[nombre]) {
      if (!iface.internal && iface.family === 'IPv4') {
        miIP = iface.address;
        break;
      }
    }
  }
  console.log('🌐 Servidor activo!');
  console.log(`→ En esta PC:   http://localhost:${PUERTO}`);
  console.log(`→ En tu celular: http://${miIP}:${PUERTO}`);
});
