const {optionsSQL} = require("./options/mysql.js");
const knex = require("knex")(optionsSQL);
const { faker } = require( '@faker-js/faker');
faker.locale = "es";

/*
knex.schema
.createTable("productos", (table) =>{
    table.increments("id"), 
    table.string("title"), 
    table.integer("price"),
    table.string("thumbnail")
})
.then(()=>{
    console.log("todo bien");
})
.catch((err)=>{
    console.log(err);
    throw new Error(err);

})
*/ 
function crearProductosRandom(){
    knex("productos")
    .insert({
            title:  faker.commerce.product(),
            price: faker.commerce.price(100, 200, 0, '$'),
            thumbnail: faker.image.imageUrl(100, 100)
        })
    .then(()=>{
        console.log("logré insertar producto random");
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        knex.destroy();
    })
}

for(let i=0; i<5; i++){
    crearProductosRandom()
}

