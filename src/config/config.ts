export default () => ({
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME
  },

  // redis: {
  //   host: process.env.REDIS_HOST,
  //   port: parseInt(process.env.REDIS_PORT || '6379')
  // }

})