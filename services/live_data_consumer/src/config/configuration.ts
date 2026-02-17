export default () => ({
  NODE_ENV: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10),
  DATABASE_URL: process.env.DATABASE_URL,

  INFLUX_URL: process.env.INFLUX_URL,
  INFLUX_TOKEN: process.env.INFLUX_TOKEN,
  INFLUX_ORG: process.env.INFLUX_ORG,
  INFLUX_BUCKET: process.env.INFLUX_BUCKET,

  NATS_URL: process.env.NATS_URL,
  NATS_SUBJECT: process.env.NATS_SUBJECT,

  UPSTOX_ACCESS_TOKEN: process.env.UPSTOX_ACCESS_TOKEN,

  DECISION: {
    MIN_CONFIDENCE: process.env.MIN_CONFIDENCE,
    MIN_STRATEGY_AGREEMENT: process.env.MIN_STRATEGY_AGREEMENT,
    ALLOW_LONG: process.env.ALLOW_LONG,
    ALLOW_SHORT: process.env.ALLOW_SHORT,
  },
});
