const express = require("express");
const cors = require("cors");
const db = require("./database");


const app = express();


app.use(cors());

app.use(express.json());



// prueba servidor

app.get("/",(req,res)=>{

    res.send("Servidor Skill Swap funcionando");

});




// REGISTRO DE USUARIO

app.post("/registro",(req,res)=>{


    const datos = req.body;


    const sql = `

    INSERT INTO usuarios

    (nombre, correo, password, edad, nivel)

    VALUES (?, ?, ?, ?, ?)

    `;



    db.query(sql,[

        datos.nombre,

        datos.correo,

        datos.password,

        datos.edad,

        datos.nivel


    ],(error,result)=>{


        if(error){

            console.log(error);


            res.status(500).json({

                mensaje:"Error al registrar usuario"

            });


            return;

        }



        res.json({

            mensaje:"Usuario registrado correctamente"

        });



    });


});





app.listen(3000,()=>{


    console.log("Servidor iniciado en puerto 3000");


});