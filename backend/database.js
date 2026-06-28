const mysql = require("mysql2");


const db = mysql.createConnection({

host:"localhost",

user:"root",

password:"root",

database:"skillswap"


});



db.connect((err)=>{


if(err){

console.log(err);


}else{


console.log("MySQL conectado correctamente");


}


});



module.exports = db;