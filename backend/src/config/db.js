const { Pool } = require('pg');
const env = require('./env');
const logger = require('./logger');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
