import config from './config';

const environment = process.env.NODE_ENV || 'development';

const baseConfig = {
  client: 'pg',
  connection: {
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './src/migrations',
  },
  seeds: {
    directory: './src/seeds',
  },
};

const knexfile = {
  development: {
    ...baseConfig,
    connection: {
      ...baseConfig.connection,
      database: 'ashlocks_dev',
    },
  },
  
  testing: {
    ...baseConfig,
    connection: {
      ...baseConfig.connection,
      database: 'ashlocks_test',
    },
  },
  
  production: {
    ...baseConfig,
    connection: {
      ...baseConfig.connection,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 2,
      max: 20,
    },
  },
};

module.exports = knexfile;