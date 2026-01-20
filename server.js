import express from "express";
import './utils/cron_tasks.js'; // Importez votre fichier cron ici
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import path from "path";
import * as faceapi from "@vladmandic/face-api";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
//
// connexion a mongodb online
import connectMongoDB from "./database/mongodb.connection.js";

//
// import des routes 
import defaultRoute from "./routes/_default.route.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import evenementRoutes from "./routes/evenement.routes.js";
import periodeRoutes from "./routes/periode.routes.js";
import periodeEnseignementRoutes from "./routes/periode_enseigenement.routes.js"
import matiereRoutes from "./routes/matiere.routes.js"; // matieres
import documentRoutes from "./routes/document.routes.js";
import qrCodeRoutes from "./routes/qr_code.routes.js";
import presenceRoutes from "./routes/presence.routes.js";
import permissionRoutes from "./routes/permission.routes.js";
import supportDeCoursRoutes from "./routes/support_cours.routes.js";
import devoirRoutes from "./routes/devoir.routes.js";

// routes de settings
import settingRoute from "./routes/settings/_setting.routes.js";
import serviceRoutes from "./routes/settings/service.routes.js";
import specialiteRoutes from "./routes/settings/specialite.routes.js";
import fonctionRoutes from "./routes/settings/fonction.routes.js";
import gradeRoutes from "./routes/settings/grade.routes.js";
import categorieRoutes from "./routes/settings/categorie.routes.js";
import regionRoutes from "./routes/settings/region.routes.js";
import departementRoutes from "./routes/settings/departement.routes.js";
import communeRoutes from "./routes/settings/commune.routes.js";
import sectionRoutes from "./routes/settings/section.routes.js";
import departementAcademiqueRoutes from "./routes/settings/departement_academique.routes.js";
import promotionRoutes from "./routes/settings/promotion.routes.js";
import cycleRoutes from "./routes/settings/cycle.routes.js";
import niveauRoutes from "./routes/settings/niveau.routes.js";
import salleDeCourRoutes from "./routes/settings/salle_de_cour.routes.js";
import typeEnseignementRoutes from "./routes/settings/type_enseignement.routes.js";
import etatEvenementRoutes from "./routes/settings/etat_evenement.routes.js";
import anneeRoutes from "./routes/settings/annee.routes.js";
import semestreRoutes from "./routes/settings/semestre.routes.js";
import tauxHoraireRoutes from "./routes/settings/taux_horaire.routes.js";
import roleRoutes from "./routes/settings/role.routes.js";
import abscenceRoutes from "./routes/absence.routes.js";
import notificationRoutes from "./routes/notification.route.js";
import evaluationRoutes from "./routes/evaluation.route.js";
import coefficientRoutes from "./routes/coefficient.route.js";
import noteRoutes from "./routes/note.route.js";
import semestreEvaluationRoutes from "./routes/semestre.route.js";
import anonymatRoutes from "./routes/anonymat.route.js";
import coefficientDisciplineRoutes from "./routes/coefficient_discipline.route.js";
import disciplineRoutes from "./routes/discipline.route.js";



// Crée une nouvelle instance de l'application Express
const app = express();

// Recréer __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Utilise le middleware express.json pour parser les corps de requête au format JSON avec une limite de 50 Mo
app.use(express.json({ limit: "50mb" }));

// Utilise le middleware CORS pour permettre les requêtes cross-origin
app.use(cors({}));

// Charge les variables d'environnement à partir du fichier .env
dotenv.config();

// Configurer express-session pour gérer les sessions d'utilisateur
app.use(session({
    // Clé secrète utilisée pour signer les cookies de session
    secret: process.env.SECRET_SESSION_KEYS,
    // Indique à Express de ne pas sauvegarder automatiquement les sessions non modifiées
    resave: false,
    // Indique à Express de ne pas sauvegarder les sessions qui n'ont pas été initialisées
    saveUninitialized: false,
}));


// Définir le chemin vers le répertoire des images
app.use('/private/images_profile', express.static('./public/images/images_profile'));
// Définir le chemin vers le répertoire des documents
app.use('/private/documents', express.static('./public/documents/documents_upload'));
// Définir le chemin vers les pièces jointes de justification absence
app.use('/private/documents', express.static('./public/documents/pieces_jointes'));
// Définir le chemin vers le répertoire des supports de cours
app.use('/private/supports', express.static('./public/supports/supports_upload'));


//
// routes de l'api
app.use("/api/v1/auth/", authRoutes);
app.use("/", defaultRoute);
app.use("/api/v1/user/", userRoutes);
app.use("/api/v1/matiere/", matiereRoutes);
app.use("/api/v1/document/", documentRoutes);
app.use("/api/v1/evenement/", evenementRoutes);
app.use("/api/v1/periode/", periodeRoutes);
app.use("/api/v1/periode-enseignement/", periodeEnseignementRoutes);
app.use("/api/v1/qr-code/", qrCodeRoutes);
app.use("/api/v1/presence/", presenceRoutes);
app.use("/api/v1/permission/", permissionRoutes);
app.use("/api/v1/support-de-cours/", supportDeCoursRoutes);
app.use("/api/v1/devoir/", devoirRoutes);

app.use("/api/v1/settings", settingRoute);
app.use("/api/v1/setting/service", serviceRoutes);
app.use("/api/v1/setting/specialite", specialiteRoutes);
app.use("/api/v1/setting/fonction", fonctionRoutes);
app.use("/api/v1/setting/grade", gradeRoutes);
app.use("/api/v1/setting/categorie", categorieRoutes);
app.use("/api/v1/setting/region", regionRoutes);
app.use("/api/v1/setting/departement", departementRoutes);
app.use("/api/v1/setting/commune", communeRoutes);
app.use("/api/v1/setting/section", sectionRoutes);
app.use("/api/v1/setting/departement-academique", departementAcademiqueRoutes);
app.use("/api/v1/setting/promotion", promotionRoutes);
app.use("/api/v1/setting/cycle", cycleRoutes);
app.use("/api/v1/setting/niveau", niveauRoutes);
app.use("/api/v1/setting/salle-de-cour", salleDeCourRoutes);
app.use("/api/v1/setting/type-enseignement", typeEnseignementRoutes);
app.use("/api/v1/setting/etat-evenement", etatEvenementRoutes);
app.use("/api/v1/setting/annee", anneeRoutes);
app.use("/api/v1/setting/semestre", semestreRoutes);
app.use("/api/v1/setting/taux-horaire", tauxHoraireRoutes);
app.use("/api/v1/setting/role", roleRoutes);
app.use("/api/v1/evaluation", evaluationRoutes)
app.use("/api/v1/coefficient", coefficientRoutes)
app.use("/api/v1/anonymat", anonymatRoutes)
app.use("/api/v1/note", noteRoutes)
app.use("/api/v1/semestre", semestreEvaluationRoutes)
app.use("/api/v1/coefficient-discipline", coefficientDisciplineRoutes)
app.use("/api/v1/discipline", disciplineRoutes)

// new
app.use("/api/v1/absence", abscenceRoutes);
app.use("/api/v1/notification", notificationRoutes);
app.use("/api/v1/alerte", abscenceRoutes);

async function loadModels() {
    // Assurez-vous que ce chemin pointe vers votre dossier de modèles
    const modelPath = path.join(__dirname, '/public/face-api-models');
    console.log(modelPath)
    await Promise.all([
        faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
        faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath)
    ]);
}


const server = createServer(app);
// Détecter l'environnement (local ou production)
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction
  ? 'https://schoolapp-t57l.onrender.com' // Origine en production
  : 'http://localhost:5173'; // Origine en local

  const originsBack = isProduction
  ? 'https://schoolapp-t57l.onrender.com' // Origine en production
  : 'http://localhost'; // Origine en local

// Initialise Socket.io après la connexion à MongoDB
export const io = new Server(server,
    {
        cors: {
            // origin: "http://localhost:5173", // Autoriser les requêtes provenant de cette URL
            origin: allowedOrigins, // Utiliser le domaine approprié
            methods: ["GET", "POST"] // Autoriser uniquement les méthodes GET et POST
        }
    });


connectMongoDB(process.env.MONGODB_URL)
    .then(async () => {

        // Gestion des connexions Socket.io
        io.on('connection', (socket) => {
            console.log('Nouvelle connexion socket établie :', socket.id);

            // Ajoute ici la logique de gestion des événements Socket.io si nécessaire
            socket.on('disconnect', () => {
                console.log('Connexion socket déconnectée :', socket.id);
            });
        });

        await loadModels();
        console.log('Modèles chargés avec succès');

        // Démarrage du serveur HTTP
        const port = process.env.PORT || 8085;
        server.listen(port, () => {
            console.log(`🚀💥 Serveur en cours d'exécution sur ${originsBack}:${port}`);
        });
    })
    .catch((error) => {
        console.log(error);
        process.exit(1); // Quitter le processus en cas d'echec
    });




