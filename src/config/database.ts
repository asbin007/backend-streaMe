import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    // Without this, an unreachable host leaves the TCP connect hanging
    // indefinitely instead of raising an error — which is what stalled boot
    // and made Render report "no open ports detected".
    connectTimeout: 15_000,
    statement_timeout: 30_000,
  },
  pool: {
    max: 10,
    min: 0,
    // Fail an acquire rather than queueing forever behind a dead pool.
    acquire: 20_000,
    idle: 10_000,
  },
  retry: { max: 3 },
  logging: false,
  models: [__dirname + '/../models'],
});

export default sequelize;
