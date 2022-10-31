require('dotenv').config();

module.exports = {
    HOST: process.env?.PG_HOST||"127.0.0.1",
    PORT: process.env?.PG_PORT||5432,
    USER: process.env?.PG_USER||"postgres",
    PASSWORD: process.env?.PG_PASSWORD||"changeme",
    DB: "postgres",
    dialect: "postgres",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
