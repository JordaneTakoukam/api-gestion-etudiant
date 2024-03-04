import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import path from "path";

//
// connexion a mongodb online
import connectMongoDB from "./database/mongodb.connection.js";

//
// import des routes 
import defaultRoute from "./routes/_default.route.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import subjectRoutes from "./routes/subject.routes.js"; // matieres
// routes de settings
import serviceRoutes from "./routes/settings/service.routes.js";
import fonctionRoutes from "./routes/settings/fonction.routes.js";
import gradeRoutes from "./routes/settings/grade.routes.js";
import categorieRoutes from "./routes/settings/categorie.routes.js";
import regionRoutes from "./routes/settings/region.routes.js";
import departementRoutes from "./routes/settings/departement.routes.js";
import communeRoutes from "./routes/settings/commune.routes.js";
import sectionRoutes from "./routes/settings/section.routes.js";
import cycleRoutes from "./routes/settings/cycle.routes.js";
import niveauRoutes from "./routes/settings/niveau.routes.js";
import salleDeCourRoutes from "./routes/settings/salle_de_cour.routes.js";



// Crée une nouvelle instance de l'application Express
const app = express();

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
const staticsPath = path.join('./');
app.use("/profile_images", express.static(path.join(staticsPath, "profile_images")));

//
// routes de l'api
app.use("/", defaultRoute);
app.use("/api/v1/auth/", authRoutes);
app.use("/api/v1/user/", userRoutes);
app.use("/api/v1/subject/", subjectRoutes);
app.use("/api/v1/calendar/", calendarRoutes);
app.use("/api/v1/schedule/", scheduleRoutes);
app.use("/api/v1/setting/service", serviceRoutes);
app.use("/api/v1/setting/fonction", fonctionRoutes);
app.use("/api/v1/setting/grade", gradeRoutes);
app.use("/api/v1/setting/categorie", categorieRoutes);
app.use("/api/v1/setting/region", regionRoutes);
app.use("/api/v1/setting/departement", departementRoutes);
app.use("/api/v1/setting/commune", communeRoutes);
app.use("/api/v1/setting/section", sectionRoutes);
app.use("/api/v1/setting/cycle", cycleRoutes);
app.use("/api/v1/setting/niveau", niveauRoutes);
app.use("/api/v1/setting/salle-de-cour", salleDeCourRoutes);




// connectMongoDB(process.env.MONGODB_URL)
//     .then(() => {
app.listen(
    process.env.PORT || 8085,
    async () => {
        console.log(`🚀💥 Serveur en cours d\'exécution sur http://localhost:${process.env.PORT} `);
    });
// })
// .catch((error) => {
//     console.log(error);
//     process.exit(1); // Quitter le processus en cas d'echec
// });




