// Create the connection to database
const knex = require('knex')({
    client: 'mysql2',
    connection: {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'gpt',
    },
});

module.exports = knex