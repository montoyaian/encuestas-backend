export interface Env {
  POSTGRES_HOST: string;
  POSTGRES_PORT: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  POSTGRES_SSL?: string;
  JWT_SECRET: string;
}
