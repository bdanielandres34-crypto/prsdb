const bcrypt = require('bcrypt');

const plain = 'admin123';
const hash = '$2b$10$qFxYZbYicrhAaGzDXeUGxOHyGmQZceCXJhuPzn/HPKlFrcZQDNdcK';

bcrypt.compare(plain, hash).then(result => {
  console.log('¿Coincide?', result);
});
