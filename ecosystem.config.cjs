module.exports = {
  apps: [
    {
      name: 'taintedgrail',
      port: 3004,
      script: './.output/server/index.mjs',
      env: {
        PORT: 3004,
        DATABASE_URL: 'mysql://taintedgrail:taintedpass123@localhost:3306/taintedgrailDB'
      }
    }
  ]
}
