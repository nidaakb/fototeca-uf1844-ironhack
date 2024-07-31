// Import third party modules that are being used in the project
const express = require('express');
const morgan = require('morgan');
const Vibrant = require('node-vibrant');
const { MongoClient , ServerApiVersion } = require('mongodb');

// Connection string for mongodb
const uri = "mongodb+srv://nidaakabbaj1997:nidaa@cluster0.8rxwus1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
}
);

// Varibale glogabl para gestionar nuestra base de datos
let database;

// We create an the express server instant
const app = express();

// Tenemos que usar un nuevo middleware para indicar a express que queremos proecesar peticiones de tipo POST
app.use(express.urlencoded({ extended: true}));

// Añadimos un nuevo middleware para que el cliente pueda hacer peitciones GET a los recursos publicos que se encuentran en la carpeta public
app.use(express.static('public'));

// Varible para indicar en que puerto tiene que escuchar nuestra app (En este caso "localhost:4000)
// process.env.PORT en render.com
// 3000 lo quiero usar para desarrollo local 
console.log("valor del PORT: ", process.env.PORT)
const PORT = process.env.PORT || 4000;

// Especificar a Express que quiero usar EJS como motor de plantillas
app.set('view engine', 'ejs');

// We use the morgan middleware to log client requests
app.use(morgan('dev'));


// Creamos base de datos de imagenes
//const images = [];
let id = 5;

// Base de datos de imágenes
let images = [];


// Añadir las condiciones para obtener el color predominante de una imagen usando el modulo Vibrant

const getColorFromImage = async (url) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const vibrant = new Vibrant(buffer);
    const palette = await vibrant.getPalette();
    const dominantColor = palette.Vibrant.getRgb();
    return `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;
};

// Actualizar el color de las imagenes predeterminadas de la pagina web cuando abrimos la pagina
/** 
const updateColorDBimages = async () => {
    for (let image of images) {
        if (!image.predominantColor) {
            image.predominantColor = await getColorFromImage(image.imageUrl);
        }
    }
}

// Actualizar los colores predominantes de las imágenes existentes al iniciar la aplicación
updateColorDBimages().then(() => {
    console.log('Colores predominantes actualizados para todas las imágenes existentes');
}).catch(error => {
    console.error('Error actualizando los colores predominantes:', error);
});

*/

// Añadimos una función para poder filtrar las imagenes por fecha
const sortImgByDate = (array) => {
    return array.sort((a, b) => new Date(a.imageDate) - new Date(b.imageDate));
};

// When the client does a GET request to '/' we render the home.ejs
app.get('/', (req,res) => {
    sortImgByDate(images);
    // 2. Usar en el home.ejs el forEach para iterar por todas las imágenes de la variable 'images'. Mostrar de momento solo el título 
    res.render('home', {
        images
    });
});

// Creamos un nuevo endpoint para gestionar la búsqueda

app.get('/search', (req,res) => {
    // 1. Coger el valor del parametro Keyword de la query string (cat)

    const keyword = req.query.keyword.toLowerCase();

    // 2. Usar el método filter para filtrar el array de images por el valor de (cat)
    
    const filteredImages = images.filter(image => image.title.toLowerCase().includes(keyword)); 

    // 3. Usar res.render para renderizar la vista home.ejs y pasarle el array de imágenes filtrado

    res.render('home', {
        images: filteredImages
    });
});



// Cuando nos hagan una petición GET a '/add-image-form' redenderizamos
app.get('/add-image-form', (req,res) => {
    res.render('img-form', {
        isImagePostedOk: undefined,
        message: ''
    });
});

// Cuando nos hagan una peticion POST a '/add-image-form' tenemos que recibir los datos del formulario y actualizar nuestra "base de datos"
app.post('/add-image-form' , async (req,res) => {
    // Todos los datos vienen en req.body
    console.log(req.body);
    // 1 - Actualizar el array 'images' con la informacion del req.body
    const { title , imageUrl , imageDate , description , category } = req.body;
    
    // hacemos la validacion si la imagen ya existe en nuestra base de datos mediante validación URL
    // hacemos validación para los characters del titulo.
    const urlValidation = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
    const titleValidation = /^[a-zA-Z0-9_ ]{1,30}$/;

    if (!urlValidation.test(imageUrl)) {
        return res.render('img-form', {
            isImagePostedOk: false,
            message: 'Invalid URL.'
        });
    }

    if (!titleValidation.test(title)) {
        return res.render('img-form', {
            isImagePostedOk: false,
            message: 'Invalid title. Only letters, numbers, spaces and underscores are allowed.'
        });
    }

    const imageExists = images.some(image => image.imageUrl === imageUrl);

    if (imageExists) {
        return res.render('img-form', {
            isImagePostedOk: false,
            message: 'This URL already exists in our database.'
        });
    }

    const predominantColor = await getColorFromImage(imageUrl);

    /** 
    images.push({ 
        id: id++,
        title, 
        imageUrl, 
        imageDate,
        description, 
        predominantColor
    });
*/
    // Insertar el nuevo documento en la colección images
    database.collection('images').insertOne({
        title,
        imageUrl,
        imageDate: new Date(imageDate),
        description,
        predominantColor,
        
    })

    res.render('img-form', {
        isImagePostedOk: true,
        message: ''
    });
});

// Endpoint para borrar una imagen
app.post('/images/:id/delete', (req,res) => {
    const { id } = req.params;
    console.log('req params: ', req.params);
    images = images.filter((i) => i.id !=id);
    res.redirect('/');
})

// Start the server
app.listen(PORT, async (req, res) => {
    console.log("Server listening on port " + PORT);

     // cuando levantamos el servidor nos conectamos a MongoDB
    try {
        await client.connect();

        // seleccionamos la base de datos
        database = client.db("photo_gallery");

        // Mensaje de confirmación de que nos hemos conectado a la base de datos
        console.log("Conexión a la base de datos OK.")

    } catch (err) {
        console.error(err);
    }
});