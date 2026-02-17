import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),

  INFLUX_URL: Joi.string().required(),
  INFLUX_TOKEN: Joi.string().required(),
  INFLUX_ORG: Joi.string().required(),
  INFLUX_BUCKET: Joi.string().required(),

  NATS_URL: Joi.string().required(),
  NATS_SUBJECT: Joi.string().required(),

  UPSTOX_ACCESS_TOKEN: Joi.string().required(),

  MIN_CONFIDENCE: Joi.number().default(0.6),
  MIN_STRATEGY_AGREEMENT: Joi.number().default(50).min(0).max(100), // Percentage 0-100
  ALLOW_LONG: Joi.boolean().default(true),
  ALLOW_SHORT: Joi.boolean().default(false),
});
