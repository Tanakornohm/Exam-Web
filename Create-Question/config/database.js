const mysql = require('mysql2');
const connection = mysql.createConnection({
    host     : '35.198.193.211', // MYSQL HOST NAME
    user     : 'root',        // MYSQL USERNAME
    password : 'Gzx30IvCM7mEABol',    // MYSQL PASSWORD
    database : 'examweb'      // MYSQL DB NAME
}).promise();
module.exports = connection;