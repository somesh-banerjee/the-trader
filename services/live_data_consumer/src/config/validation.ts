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
});