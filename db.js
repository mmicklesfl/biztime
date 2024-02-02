const { Pool } = require('pg');

// Initialize a new pool instance with database connection details
const pool = new Pool({
  user: 'marissa',
  host: 'localhost',
  database: 'biztime',
  password: process.env.BIZTIME_DB_PASSWORD, // Using environment variable for password rather than hard-coding pw into the app
  port: 5432,
});

// Export pool for use in other parts of the application
module.exports = pool;
