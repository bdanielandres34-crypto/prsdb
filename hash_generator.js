const bcrypt = require('bcrypt');

// Aquí escribes la contraseña que quieres usar:
const plainPassword = 'admin123';

bcrypt.hash(plainPassword, 10).then(hash => {
  console.log('Hash generado:', hash);
}).catch(console.error);
