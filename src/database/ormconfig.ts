import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const isPostgresSslEnabled = process.env.POSTGRES_SSL === 'true';

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  ssl: isPostgresSslEnabled ? { rejectUnauthorized: false } : false,
  entities: ['./src/**/*.entity.ts'],
  migrations: ['./src/database/migrations/*.ts'],
  synchronize: false,
});
