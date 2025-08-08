const cors = require('cors');

const corsOptions = {
  origin: 'http://localhost:3000', // React frontend'in çalıştığı adres
  credentials: true
};

module.exports = cors(corsOptions);
