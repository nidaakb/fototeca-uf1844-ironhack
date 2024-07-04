// Import third party modules
const express = require('express');
const morgan = require('morgan')

// We create an the express server instant
const app = express();

// Tenemos que usar un nuevo middleware para indicar a express que queremos proecesar peticiones de tipo POST
app.use(express.urlencoded({ extended: true}));

// Añadimos un nuevo middleware para que el cliente pueda hacer peitciones GET a los recursos publicos que se encuentran en la carpeta public
app.use(express.static('public'));

// Creamos base de datos
const images = [];

// Especificar a Express que quiero usar EJS como motor de plantillas
app.set('view engine', 'ejs');

// We use the morgan middleware to log client petitions
app.use(morgan('dev'));

// When the client does a GET petition to '/' we render the home.ejs
app.get('/', (req,res) => {

    // 2. Usar en el home.ejs el forEach para iterar por todas las imágenes de la variable 'images'. Mostrar de momento solo el título 
    res.render('home', {
        images
    });
});

// Cuando nos hagan una petición GET a '/add-image-form' redenderizamos
app.get('/add-image-form', (req,res) => {
    res.render('img-form', {
        isImagePostedOk: undefined
    });
});

// Cuando no hagan una peticion POST a '/add-image-form' tenemos que recibir los datos del formulario y actualizar nuestra "base de datos"
app.post('/add-image-form' , (req,res) => {
    // Todos los datos vienen en req.body
    console.log(req.body);
    // 1 - Actualizar el array 'images' con la informacion del req.body
    const { title } = req.body;

    images.push({
        title
    }); // otra manera seria images.push(req.body);

    console.log('Array de imagenes actualizado: ', images);

    // 3 - Añadir los otros campos del formulario y sus validaciones
    // res.send('Datos recibidos');
    // Redirect es un método del objeto response que permite redirigir al cliente a un nuevo endpoint o vista
    // res.redirect('/add-image-form'); --> esto hace la función pero el send successful es transparente para el usuario. entonces para arreglar eso seria:
    res.render('img-form', {
        isImagePostedOk: true
    });
});


// We create the server
app.listen(3000, (req,res) =>{
    console.log("Server listening in port 3000.")
});
