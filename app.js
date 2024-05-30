const express = require('express');
const app = express()
const server = require("http").Server(app);
const io = require("socket.io")(server);
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv').config()
const cookieParser = require('cookie-parser');
const os = require('os-utils');
const { v4: uuidv4 } = require("uuid");
const session = require('express-session');
const minifyHTML = require('express-minify-html');
const compression = require('compression')
const modRoute = require('./src/routes/mod');
const { connectMongo } = require('./src/database/mongo')
const { cronAuto } = require('./src/cron/createTransaction')
const mongoURI = process.env.MONGO_URL;
    connectMongo(mongoURI);



app.set('view engine', 'pejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('trust proxy', true)

app.use(cors())
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')))

app.use(minifyHTML({
    override: false,
    exception_url: false,
    htmlMinifier: {
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true,
        minifyJS: true
    }
}));

app.use(modRoute);



app.use(function (req, res, next) {

    if (req.header("Content-Type") !== "application/json"){

        res.json({
            success: false,
            message: "Page not exists"
        })

    }else{

        res.json({
            success: false,
            message: "Page not exists"
        })

        
    }
        
    

})

cronAuto()

server.listen(process.env.PORT || 8888, () => console.log(`Server đang hoạt động port: ${process.env.PORT || 8888}`));

