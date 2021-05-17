// Routing
/* GET home page */
const https = require('https');
const express = require('express')
const app = express()
const handlebars = require('express-handlebars')
var path = require('path')
app.set('view engine', 'handlebars')
app.engine('handlebars', handlebars({
    layoutsDir: __dirname + '/views/layouts',
}))
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const portSerie = new SerialPort('/dev/cu.usbmodem141203', { baudRate: 9600 }); //Déclaration du port série et de son baudrate
const parser = portSerie.pipe(new Readline({ delimiter: '\n' })); //Déclaration du parser (cela va servir à récupérer les données du port série de façon ordonnée)
/* Initialisation des variables à utiliser */
var serialData = "0";
var adresse = '',
    ville = '',
    pays = '',
    cp = '',
    lieu = '';
var obj = '';
var infos = [];
var lat = 1.0,
    lon = 1.0,
    temp = 0;
portSerie.on('open', onOpen);

function onOpen() {
    console.log('Connexion établie ! ');
}
/**
 * Fonction onData
 * Cette fonction a pour but de traiter la donnée reçue par le port série et d'isoler chaque paramètre contenus dans la trame
 * Entrée : data => une chaîne de caractère qui contient toute la donnée à traiter
 */
function onData(data) {
    /* Utilisation de l'UTF-8 */
    serialData = data.toString('utf-8');
    console.log(serialData);
    /* Transformation de la chaîne de caractère en tableau de chaîne de caractères (on isole chaque paramètres séparés par une virgule) */
    serialData = serialData.split(' ');
    serialData = serialData[2].split(',');
    /* Conversion d'une chaîne de caractère en nombre réel */
    temp = parseFloat(serialData[2]);
    lon = parseFloat(serialData[1]) / 100;
    lat = parseFloat(serialData[0]) / 100;
    /* Conversion des coordonnées GPS à cause des distances orthométriques */
    var latint = Math.floor(lat);
    var lonint = Math.floor(lon);
    lon = lonint + (((lon - lonint)) / 0.6);
    lat = latint + (((lat - latint)) / 0.6);
    console.log("Data : " + lon);
    console.log("Data : " + lat);
}
parser.on('data', onData) // Détection de données sur le port série

portSerie.on('error', console.log) // Détection d'erreur
portSerie.on("close", () => port.open()); // Détection de fermeture

app.get('/', function(req, res) {
        /*Url de l'API de données GPS (rue, pays etc...) avec les paramètres (lon/lat)*/
        var url = 'https://us1.locationiq.com/v1/search.php?key=pk.4ca92d593ca802d4f4d9b40f4a45bba6&q=' + lat + '%20' + lon + '&accept-language=fr&format=json';
        /* Requête pour afficher la page web*/
        https.get(url, (resp) => {
            let data = '';

            //De la donnée est reçue
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                /* Récupération et traitement de la donnée en JSON reçue par l'API */
                obj = JSON.parse(data);
                infos = obj[0]["display_name"].split(', ');
                adresse = infos[1] + ' ' + infos[2];
                ville = infos[4];
                cp = infos[8];
                pays = infos[7];
                lieu = infos[0];
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message); //Si on détecte une erreur
        });
        /*On fait passer les variables du backend au frontend via la fonction render*/
        res.render('main', { longitude: lon, latitude: lat, temperature: temp, ville: ville, adresse: adresse, cp: cp, pays: pays, lieu: lieu, layout: 'index' })
    })
    /* Utilisation d'express en Node.js pour créer un serveur */
app.use(express.static(path.join(__dirname, 'public')));

/* Démarrage du serveur sur le port 3000*/
app.listen(3000, function() {
    console.log('Votre app est disponible sur localhost:3000 !')
})