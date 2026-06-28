const mysql = require("mysql2");


const connection = mysql.createConnection({

    host:"localhost",

    user:"root",

    password:"root",

    database:"skillswap"

});



connection.connect((error)=>{


    if(error){

        console.log(error);

        return;

    }


    console.log("MySQL conectado correctamente");


});


module.exports = connection;