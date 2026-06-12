export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  database: {
    url: string;
  };
  cors: {
    origin: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  externalApi: {
    footballData: {
      apiKey: string;
      baseUrl: string;
    };
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
  externalApi: {
    footballData: {
      apiKey: process.env.FOOTBALL_DATA_API_KEY ?? '',
      baseUrl:
        process.env.FOOTBALL_DATA_BASE_URL ??
        'https://api.football-data.org/v4',
    },
  },
});
