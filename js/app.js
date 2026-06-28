const formulario = document.querySelector("#registroForm");


formulario.addEventListener("submit",(e)=>{


    e.preventDefault();



    const usuario = {


        nombre:
        document.querySelector("#nombre").value,


        correo:
        document.querySelector("#correo").value,


        password:
        document.querySelector("#password").value,


        edad:
        document.querySelector("#edad").value,


        nivel:
        document.querySelector("#nivel").value



    };




    fetch("http://localhost:3000/registro",{


        method:"POST",


        headers:{


            "Content-Type":"application/json"


        },


        body:JSON.stringify(usuario)



    })


    .then(res=>res.json())


    .then(data=>{


        alert(data.mensaje);


        formulario.reset();


    });



});