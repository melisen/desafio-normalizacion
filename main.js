
const express = require('express');
const handlebars = require('express-handlebars');
const {Server: HTTPServer} = require("http");
const normalize = require("normalizr").normalize;
const schema = require("normalizr").schema;
const fs = require('fs');
const { faker } = require("@faker-js/faker");
faker.locale = "es";
const {Server: IOServer} = require("socket.io")
const app = express();
const httpServer = new HTTPServer(app)
const io = new IOServer(httpServer)



//productos
const {optionsSQL} = require("./options/mysql.js");
const ContenedorProductos = require('./clase-contenedor.js');
const arrayProductos = new ContenedorProductos(optionsSQL, "productos");



//mensajes
const  mongoose  = require("mongoose");
const connect  = mongoose.connect;
const Schema = mongoose.Schema;
 const model = mongoose.model;
const ContenedorMongoDB = require("./ContenedorMongoDB.js");

const mensajeSchemaMongo = new Schema({
        email: { type: String, required: true, max:100 },
        nombre: { type: String, required: true, max: 100 },
        apellido: { type: String, required: true, max: 100 },
        edad: { type: String, required: true, max: 3 },
        alias: { type: String, required: true, max: 100 },
        avatar: { type: String, required: true, max: 1000 },
        text: {type: String, required:true, max: 1000 }
  });
    const modeloMensajes = model('modeloMensajes', mensajeSchemaMongo);

    const rutaConnectMensajes = 'mongodb://127.0.0.1:27017/DB-Mensajes'
    const baseMongo = 'DB-Mensajes';
    const coleccionMensajes = 'coleccionMensajes';
    const Mensajes = new ContenedorMongoDB(rutaConnectMensajes, mensajeSchemaMongo, baseMongo, coleccionMensajes );


app.use(express.static('views'))
//*HANDLEBARS
app.set('views', './views/')
 const hbs = handlebars.engine({
   extname: "hbs",
   layoutsDir: "./views/layouts/",
 });
 app.engine("hbs", hbs);

 app.set("view engine", "hbs")


 app.use(express.urlencoded({extended: true}))
 app.use(express.json())


 app.get('/', async (req, res)=>{
    const listaProductos = await arrayProductos.getAll();
    if(listaProductos){
        res.render("main", { layout: "vista-productos", productos: listaProductos });
    }else{
        res.render("main", {layout: "error"})
    }
})

//productos-test


async function crearProductosRandom(){
    let listaProductos = [];
    for(let i=0; i<5; i++){
        let prodRandom =  {
            title: faker.commerce.product(),
            price: faker.commerce.price(100, 200, 0, '$'),
            thumbnail: faker.image.imageUrl(100, 100).toString()
        } 
        //console.log(Object.values(prodRandom))
        listaProductos += prodRandom;
    }
    let listaStringify = JSON.stringify(listaProductos)
    await fs.promises.writeFile("./productos.txt", listaStringify, (err=>{
        if(err){
            console.log(err)
        }
    }))
    let productosRandom = await fs.promises.readFile("./productos.txt", "utf-8");
    let prodRandomString = await JSON.parse(productosRandom)
    console.log(prodRandomString)
    return prodRandomString;
    
}
const listaProductosRandom = crearProductosRandom();
;

app.get('/api/productos-test', async (req, res)=>{
    res.render("main", { layout: "productos-random", productos: listaProductosRandom});
})


//*WEBSOCKET para tabla de productos y mensajes
//'1) conexión del lado del servidor
io.on('connection', async (socket) =>{
    console.log(`io socket conectado, socket id ${socket.id}`)
    socket.emit("mensajes", await Mensajes.listarTodos())
    socket.emit("productos", await arrayProductos.getAll()) 
    socket.emit("productos-random", listaProductosRandom)

    //' 3) escuchar un cliente (agrega un objeto de producto)
    socket.on('new_prod', async (data) =>{
        await arrayProductos.save(data)
        const listaActualizada = await arrayProductos.getAll();

        //' 4) y propagarlo a todos los clientes: enviar la info a todos los usuarios conectados: todos pueden ver la tabla actualizada en tiempo real
        io.sockets.emit('productos', listaActualizada)
    })

    //*WEBSOCKET para recibir y guardar nuevo mensaje, y enviar el array de mensajes a todos los usuarios conectados
    socket.on('new_msg', async (data)=>{
        await Mensajes.guardar(data);
        const listaMensajes = await Mensajes.listarTodos();
        const authorSchema = new schema.Entity('author',{
            nombre,
            apellido,
            edad,
            avatar,
            alias,
            idAttirbute: 'email'
        });
        const textSchema = new schema.Entity('text');
        const mensajeSchema = new schema.Entity('mensajes', {
            author: authorSchema,
            text: [ textSchema ]
           });

        const normalizado = normalize(listaMensajes, mensajeSchema);
        io.sockets.emit('mensajes', normalizado)
    })
})








httpServer.listen(8080, ()=>{
    console.log('servidor de express iniciado')
})