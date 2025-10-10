import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  MONGO_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().required(),
  DB_SYNC: Joi.boolean().default(false),
  EMAIL_PROVIDER: Joi.string().valid('sendgrid', 'ses', 'smtp').default('smtp'),
  EMAIL_HOST: Joi.string().optional(),
  EMAIL_PORT: Joi.number().optional(),
  EMAIL_SECURE: Joi.boolean().optional(),
  EMAIL_USER: Joi.string().optional(),
  EMAIL_PASS: Joi.string().optional(),
  EMAIL_FROM: Joi.string().optional(),
  EMAIL_API_KEY: Joi.string().optional(),
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(10),
  FRONTEND_URL: Joi.string().optional(),
  USE_REDIS: Joi.boolean().default(true),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  CACHE_TTL: Joi.number().default(300),
  // Google Cloud Configuration
  GOOGLE_CLOUD_PROJECT_ID: Joi.string().optional(),
  GOOGLE_CLOUD_LOCATION: Joi.string().optional(),
  GOOGLE_CLOUD_CREDENTIALS: Joi.string().optional(),
  GOOGLE_CLOUD_AGENT_ID: Joi.string().optional(),
  GOOGLE_CLOUD_ENDPOINT_ID: Joi.string().optional(),
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CALLBACK_URL: Joi.string().optional(),

  // Stripe Configuration
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().required(),
  
  // Ollama Configuration
  OLLAMA_HOST: Joi.string().default('http://localhost:11434'),
  OLLAMA_BASE_URL: Joi.string().default('http://localhost:11434/v1/'),
  OLLAMA_MODEL: Joi.string().default('gemma2:2b'),
  OLLAMA_EMBEDDING_MODEL: Joi.string().default('nomic-embed-text'),
});
