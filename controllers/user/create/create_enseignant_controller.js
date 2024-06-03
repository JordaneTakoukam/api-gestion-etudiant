import User from '../../../models/user.model.js';
import { message } from '../../../configs/message.js';
import { appConfigs } from "../../../configs/app_configs.js";
import mongoose from 'mongoose';
import { sendPasswordOnEmail } from "../../../utils/send_password_on_email.js";
import bcrypt from "bcrypt";
import { DateTime } from "luxon";
import Absences from '../../../models/absences/absence.model.js';
import Periode from '../../../models/periode.model.js';
import Setting from '../../../models/setting.model.js';
import { formatDateFr, formatYear, generatePDFAndSendToBrowser, loadHTML } from '../../../fonctions/fonctions.js';
import cheerio from 'cheerio';
import { readFileSync } from 'fs';

export const createEnseignant = async (req, res) => {
    const {
        // info obligatoire
        nom,
        genre,
        email,

        // autre info necessaire
        photo_profil,
        contact,
        matricule,
        prenom,
        date_naiss,
        lieu_naiss,
        date_entree,

        // autres (object Id)
        abscences,
        niveaux,

        // grade,
        categorie,
        fonction,
        service,
        commune,

    } = req.body;

    try {

        // Vérifier que tous les champs obligatoires sont présents
        if (!nom || !niveaux || !email || !genre) {
            return res.status(400).json({ success: false, message: message.champ_obligatoire });
        }

        
        // Vérifier si l'utilisateur existe déjà avec cet e-mail
        const existingUserWithEmail = await User.findOne({ email });

        if (existingUserWithEmail) {
            return res.status(400).json({
                success: false,
                message: message.emailExiste,
            });
        }

        //vérifier si le matricule exite déjà
        if(matricule){
            const existingMatricule = await User.findOne({ matricule });

            if (existingMatricule) {
                return res.status(400).json({
                    success: false,
                    message: message.enseignant_existe,
                });
            }
        }

        if (abscences) {
            for (const absence of abscences) {
                if (!mongoose.Types.ObjectId.isValid(absence)) {
                    return res.status(400).json({
                        success: false,
                        message: message.absence_invalide,
                    });
                }
            }
        }

        // verifier si le niveau
        if (niveaux) {
            for (const niveau of niveaux) {
                if (!mongoose.Types.ObjectId.isValid(niveau.niveau)) {
                    return res.status(400).json({
                        success: false,
                        message: message.niveau_invalide,
                    });
                }
            }
        }


        // vérifier le grade
        // if (grade) {
        //     if (!mongoose.Types.ObjectId.isValid(grade)) {
        //         return res.status(400).json({
        //             success: false,
        //             message: message.grade_invalide,
        //         });
        //     }
        // }

        // vérifier le service
        if (service) {
            if (!mongoose.Types.ObjectId.isValid(service)) {
                return res.status(400).json({
                    success: false,
                    message: message.service_invalide,
                });
            }
        }

        //vérifier la catégorie
        if (categorie) {
            if (!mongoose.Types.ObjectId.isValid(categorie)) {
                return res.status(400).json({
                    success: false,
                    message: message.categorie_invalide,
                });
            }
        }

        //vérifier la fonction
        if (fonction) {
            if (!mongoose.Types.ObjectId.isValid(fonction)) {
                return res.status(400).json({
                    success: false,
                    message: message.fonction_invalide,
                });
            }
        }

        // vérifier la commune
        if (commune) {
            if (!mongoose.Types.ObjectId.isValid(commune)) {
                return res.status(400).json({
                    success: false,
                    message: message.commune_invalide,
                });
            }
        }



        const role = appConfigs.role.enseignant;
        // mot de psase par defaut
        const mot_de_passe = process.env.DEFAULT_ENSEIGNANT_PASSWORD

        const saltRounds = 10; // Nombre de tours pour le hachage
        const hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);

        const currentDate = DateTime.now();

        // Créer un nouvel utilisateur avec tous les champs fournis
        const newUser = new User({
            roles: [role],
            nom,
            genre,
            email,
            //
            photo_profil,
            contact,
            matricule,
            prenom,
            date_creation: currentDate,
            date_naiss,
            lieu_naiss,
            date_entree,

            //
            historique_connexion: [],
            mot_de_passe: hashedPassword,

            // object Id
            abscences,
            niveaux,

            // grade,
            categorie,
            fonction,
            service,
            commune,
        });


        const newEnseignant = await newUser.save();


        const userData = newEnseignant.toObject();
        sendPasswordOnEmail(userData.nom, userData.email, mot_de_passe);
        delete userData.mot_de_passe;
        
        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: userData,
        });


    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

export const updateEnseignant = async (req, res) => {
    const {enseignantId}=req.params;
    const {
        // info obligatoire
        nom,
        genre,
        email,

        // autre info necessaire
        photo_profil,
        contact,
        matricule,
        prenom,
        date_naiss,
        lieu_naiss,
        date_entree,

        // autres (object Id)
        abscences,
        niveaux,

        // grade,
        categorie,
        fonction,
        service,
        commune,

    } = req.body;

    try {

        // Vérifier que tous les champs obligatoires sont présents
        if (!nom || !niveaux || !email || !genre) {
            return res.status(400).json({ success: false, message: message.champ_obligatoire });
        }

        if (!mongoose.Types.ObjectId.isValid(enseignantId)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide
            });
        }

        
        // Vérifier si l'étudiant à modifier existe dans la base de données
        const existingEnseignant = await User.findById(enseignantId);
        if (!existingEnseignant) {
            return res.status(404).json({ 
                success: false, 
                message: message.enseignant_non_trouvee
            });
        }

        
        if(existingEnseignant.email!==email){
            const existingUserWithEmail = await User.findOne({ email });
            if (existingUserWithEmail) {
                return res.status(400).json({
                    success: false,
                    message: message.emailExiste,
                });
            }
        }
            
        //vérifier si le matricule exite déjà
        if (existingEnseignant.matricule !== matricule) {
            const existingMatricule = await User.findOne({ matricule });
            if (existingMatricule) {
                return res.status(400).json({
                    success: false,
                    message: message.enseignant_existe,
                });
            }
        }

        if (abscences) {
            for (const absence of abscences) {
                if (!mongoose.Types.ObjectId.isValid(absence)) {
                    return res.status(400).json({
                        success: false,
                        message: message.absence_invalide,
                    });
                }
            }
        }

        // verifier si le niveau
        if (niveaux) {
            for (const niveau of niveaux) {
                if (!mongoose.Types.ObjectId.isValid(niveau.niveau)) {
                    return res.status(400).json({
                        success: false,
                        message: message.niveau_invalide,
                    });
                }
            }
        }


        // vérifier le grade
        // if (grade) {
        //     if (!mongoose.Types.ObjectId.isValid(grade)) {
        //         return res.status(400).json({
        //             success: false,
        //             message: message.grade_invalide,
        //         });
        //     }
        // }

        // vérifier le service
        if (service) {
            if (!mongoose.Types.ObjectId.isValid(service)) {
                return res.status(400).json({
                    success: false,
                    message: message.service_invalide,
                });
            }
        }

        //vérifier la catégorie
        if (categorie) {
            if (!mongoose.Types.ObjectId.isValid(categorie)) {
                return res.status(400).json({
                    success: false,
                    message: message.categorie_invalide,
                });
            }
        }

        //vérifier la fonction
        if (fonction) {
            if (!mongoose.Types.ObjectId.isValid(fonction)) {
                return res.status(400).json({
                    success: false,
                    message: message.fonction_invalide,
                });
            }
        }

        // vérifier la commune
        if (commune) {
            if (!mongoose.Types.ObjectId.isValid(commune)) {
                return res.status(400).json({
                    success: false,
                    message: message.commune_invalide,
                });
            }
        }


        // Créer un nouvel utilisateur avec tous les champs fournis
        existingEnseignant.nom = nom;
        existingEnseignant.prenom = prenom;
        existingEnseignant.matricule = matricule;
        existingEnseignant.niveaux = niveaux;
        existingEnseignant.email = email;
        existingEnseignant.genre = genre;
        existingEnseignant.date_naiss = date_naiss;
        existingEnseignant.lieu_naiss = lieu_naiss;
        existingEnseignant.photo_profil = photo_profil;
        existingEnseignant.contact = contact;
        existingEnseignant.date_entree = date_entree;
        // existingEnseignant.grade = grade;
        existingEnseignant.categorie = categorie;
        existingEnseignant.fonction = fonction;
        existingEnseignant.service = service;
        existingEnseignant.commune = commune;

        const updateEnseignant = await existingEnseignant.save();
        const userData = updateEnseignant.toObject();
        delete userData.mot_de_passe;
        res.json({
            success: true,
            message: message.mis_a_jour,
            data: userData,
        });


    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

export const getEnseignantsByFilter = async (req, res) => {
    const { page = 1, pageSize = 10, grade, categorie, service, fonction } = req.query;
    const role = appConfigs.role.enseignant;
    try {
        // Construire la requête de base pour filtrer les enseignants
        const query = {
            roles: { $in: [role] } // Filtrer les utilisateurs avec le rôle enseignant
        };

        // Ajouter les filtres supplémentaires si disponibles
        if (grade && mongoose.Types.ObjectId.isValid(grade)) {
            query.grade = grade;
        }

        if (categorie && mongoose.Types.ObjectId.isValid(categorie)) {
            query.categorie = categorie;
        }

        if (service && mongoose.Types.ObjectId.isValid(service)) {
            query.service = service;
        }

        if (fonction && mongoose.Types.ObjectId.isValid(fonction)) {
            query.fonction = fonction;
        }

        const skip = (page - 1) * pageSize;

        const enseignants = await User.find(query)
            .skip(skip)
            .limit(Number(pageSize));

        const totalEnseignants = await User.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                enseignants,
                currentPage: page,
                totalPages: Math.ceil(totalEnseignants / pageSize),
                totalItems: totalEnseignants,
                pageSize:pageSize
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des enseignants :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
};

export const getAllEnseignantsByFilter = async (req, res) => {
    const {grade, categorie, service, fonction } = req.query;
    const role = appConfigs.role.enseignant;
    try {
        // Construire la requête de base pour filtrer les enseignants
        const query = {
            roles: { $in: [role] } // Filtrer les utilisateurs avec le rôle enseignant
        };

        // Ajouter les filtres supplémentaires si disponibles
        if (grade && mongoose.Types.ObjectId.isValid(grade)) {
            query.grade = grade;
        }

        if (categorie && mongoose.Types.ObjectId.isValid(categorie)) {
            query.categorie = categorie;
        }

        if (service && mongoose.Types.ObjectId.isValid(service)) {
            query.service = service;
        }

        if (fonction && mongoose.Types.ObjectId.isValid(fonction)) {
            query.fonction = fonction;
        }

        const enseignants = await User.find(query);


        res.json({
            success: true,
            data: {
                enseignants,
                currentPage:0,
                totalPages: 0,
                totalItems: 0,
                pageSize:0,
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des enseignants :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
};

export const getEnseignantsByNomPrenom = async (req, res) => {
    const role = appConfigs.role.enseignant;
    try {
        // Construire la requête de base pour filtrer les enseignants
        const query = {
            roles: { $in: [role] } // Filtrer les utilisateurs avec le rôle enseignant
        };

        const enseignants = await User.find(query)
                            .select("_id nom prenom");


        res.json({
            success: true,
            data: {
                enseignants,
                currentPage:0,
                totalPages: 0,
                totalItems: 0,
                pageSize:0,
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des enseignants :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
};


export const searchEnseignant = async (req, res) => {
    const role = appConfigs.role.enseignant;
    const { searchString } = req.params; // Récupère la chaîne de recherche depuis les paramètres de requête
    console.log(searchString);
    try {
        // Construire la requête de base pour filtrer les enseignants
        const query = {
            roles: { $in: [role] } // Filtrer les utilisateurs avec le rôle enseignant
        };

        // Ajouter une condition pour chercher par nom si searchString est fourni
        if (searchString) {
            query.nom = { $regex: `^${searchString}`, $options: 'i' }; // Filtrer par nom commençant par searchString, insensible à la casse
        }

        const enseignants = await User.find(query)
            .select("_id nom prenom")
            .sort({ nom: 1, prenom:1 }) 
            .limit(5); // Limite à 5 résultats

        res.json({
            success: true,
            data: {
                enseignants,
                currentPage: 0,
                totalPages: 1,
                totalItems: enseignants.length,
                pageSize: 5,
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des enseignants :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
};


export const getTotalEnseignants = async (req, res) => {
    try {
        const role = appConfigs.role.enseignant;
        const query= {
            roles: { $in: [role] } // Filtrer les utilisateurs avec le rôle enseignant
        };
        const enseignants = await User.find(query);
        const totalEnseignants = enseignants.length;

        res.json({
            success: true,
            data: totalEnseignants,
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des étu :', error);
        return { success: false, message: 'Une erreur est survenue lors de la récupération des étudiants.' };
    }
};

export const getNiveauxByEnseignant = async (req, res) => {
    const { enseignantId } = req.params;
    const { annee, semestre } = req.query;

    try {
        // Vérifier si l'ID de l'enseignant est valide
        if (!mongoose.Types.ObjectId.isValid(enseignantId)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }

        // Création du filtre initial pour les périodes
        const filter = { 
            $or: [
                { enseignantPrincipal: enseignantId },
                { enseignantSuppleant: enseignantId }
            ]
        };

        // Si une année est spécifiée dans la requête, l'utiliser
        if (annee && !isNaN(annee)) {
            filter.annee = parseInt(annee);
            let periodesCurrentYear = await Periode.findOne(filter).exec();
            if (!periodesCurrentYear) {
                // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
                let found = false;
                let previousYear = parseInt(annee) - 1;
                while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
                    periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
                    if (periodesCurrentYear) {
                        filter.annee = previousYear;
                        found = true;
                    } else {
                        previousYear--;
                    }
                }
            } 
        }

        // Si un semestre est spécifié dans la requête, l'utiliser
        if (semestre && !isNaN(semestre)) {
            filter.semestre = parseInt(semestre);
        }

        // Rechercher les périodes en fonction du filtre
        const periodes = await Periode.find(filter).distinct('niveau').exec();
        const niveaux = periodes.map(periode => ({ niveau: periode, annee: annee }));
        // console.log(niveaux)
        // Envoyer la réponse avec les données
        res.status(200).json({ 
            success: true,
            data:niveaux
            
        });
    } catch (error) {
        // Gérer les erreurs
        console.error('Erreur lors de la récupération des niveaux par enseignant :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};

export const generateListEnseignant = async (req, res)=>{
    const {grade, categorie, service, fonction, langue, annee } = req.query;
    const role = appConfigs.role.enseignant;
    const query = {
        roles: { $in: [role] } // Filtrer les utilisateurs avec le rôle enseignant
    };
    // Ajouter les filtres supplémentaires si disponibles
    let title="";
    if (grade && mongoose.Types.ObjectId.isValid(grade)) {
        query.grade = grade;
        title=langue==='fr'?"PAR GRADE":"PER GRADE";
    }

    if (categorie && mongoose.Types.ObjectId.isValid(categorie)) {
        query.categorie = categorie;
        title=langue==='fr'?"PAR CATEGORIE":"PER CATEGORY";
    }

    if (service && mongoose.Types.ObjectId.isValid(service)) {
        query.service = service;
        title=langue==='fr'?"PAR SERVICE":"PER SERVICE";
    }

    if (fonction && mongoose.Types.ObjectId.isValid(fonction)) {
        query.fonction = fonction;
        title=langue==='fr'?"PAR FONCTION":"PER FUNCTION";
    }

    const enseignants = await User.find(query);
    let filePath='./templates/templates_fr/template_liste_enseignant_fr.html';
    if(langue==='en'){
        filePath='./templates/templates_en/template_liste_enseignant_en.html'
    }
    const htmlContent = await fillTemplate(title, langue, enseignants, filePath, annee);

    // Générer le PDF à partir du contenu HTML
    generatePDFAndSendToBrowser(htmlContent, res, 'landscape');
}

async function fillTemplate (title, langue, enseignants, filePath, annee) {
    try {
        const htmlString = await loadHTML(filePath);
        const $ = cheerio.load(htmlString); // Charger le template HTML avec cheerio
        const body = $('body');
        body.find('#title').text(title);
        body.find('#annee').text(formatYear(parseInt(annee)));
        const userTable = $('#table-enseignant');
        const rowTemplate = $('.row_template');
        let i = 1;
        let settings = await Setting.find().select('grades categories fonctions services');
        let setting = null;
        if(settings.length>0){
            setting=settings[0]
        }
        
        for (const enseignant of enseignants) {
            const clonedRow = rowTemplate.clone();
            clonedRow.find('#num').text(i);
            clonedRow.find('#matricule').text(enseignant.matricule!=null?enseignant.matricule:"");
            clonedRow.find('#nom').text(enseignant.nom);
            clonedRow.find('#prenom').text(enseignant.prenom);
            clonedRow.find('#genre').text(enseignant.genre);
            clonedRow.find('#e-mail').text(enseignant.email);
            clonedRow.find('#grade').text("");
            clonedRow.find('#categorie').text("");
            clonedRow.find('#service').text("");
            clonedRow.find('#fonction').text("");
            if(enseignant.grade!=null && setting){
                const grade=setting.grades.find((grade)=>grade._id.toString()===enseignant.grade.toString());
                clonedRow.find('#grade').text(langue==='fr'?grade?.libelleFr??"":grade?.libelleEn??"");
            }
            if(enseignant.categorie!=null && setting){
                const categorie = setting.categories.find((categorie)=>categorie._id.toString()===enseignant.categorie.toString());
                clonedRow.find('#categorie').text(langue==='fr'?categorie?.libelleFr??"":categorie?.libelleEn??"");
            }
            if(enseignant.service!=null && setting){
                const service = setting.services.find((service)=>service._id.toString()===enseignant.service.toString());
                clonedRow.find('#service').text(langue==='fr'?service?.libelleFr??"":service?.libelleEn??"");
            }
            if(enseignant.fonction!=null && setting){
                const fonction = setting.fonctions.find((fonction)=>fonction._id.toString()===enseignant.fonction.toString());
                clonedRow.find('#fonction').text(langue==='fr'?fonction?.libelleFr??"":fonction?.libelleEn??"");
            }
            
            
            userTable.append(clonedRow);
            i++;
        }
        rowTemplate.first().remove();

        return $.html(); // Récupérer le HTML mis à jour
    } catch (error) {
        console.error('Erreur lors du remplissage du template :', error);
        return '';
    }
};

async function lireDonneesFichierCSV(niveau, fichier) {
    
    // // Structure pour stocker les données
    const donnees = [];
    const mot_de_passe = process.env.DEFAULT_ENSEIGNANT_PASSWORD

    const saltRounds = 10; // Nombre de tours pour le hachage
    const hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);
    try {
        // Lire le fichier texte de manière synchrone
        const data = readFileSync(fichier, 'utf8');
        
    
        // // Split data into lines
        const lines = data.split('\n');
        lines.forEach((line, index) => {
        line = line.split(';');
        

        const currentDate = DateTime.now();
        
        if (line.length === 0) return;

           
            let currentStudent = {
                nom: line[0].trim(),
                prenom:line[1].trim(),
                mot_de_passe:hashedPassword,
                genre:line[2].trim(),
                roles:[appConfigs.role.enseignant],
                // niveaux:[{niveau:niveau, annee:2023}],
                email:line[3].replace('\r', "").trim(),
                date_creation:currentDate
            };

            donnees.push(currentStudent);
            
    });
    
      } catch (err) {
        console.error('Erreur lors de la lecture du fichier:', err);
      }
    
    
    return donnees;
}

export const createManyEnseignant = async (req, res) => {
    try {
        const filePath = './liste_enseignant.csv';
        const niveau="665c40a406d18fba0d8236ae";
        const donnees = await lireDonneesFichierCSV(niveau,filePath);
        const result = await User.insertMany(donnees);
        res.status(201).json({ success: true, message: "Ajouté avec succès", data: result });
        

    } catch(e) {
        console.log(e);
    }
}



