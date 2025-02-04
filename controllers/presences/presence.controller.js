import Presence from '../../models/presence.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import cheerio from 'cheerio';
import { extractRawText } from 'mammoth';
import ExcelJS from 'exceljs'
import Periode from '../../models/periode.model.js';
import {generatePDFAndSendToBrowser, formatYear, loadHTML, calculGrossBonus, calculIRNC, calculNetBonus} from '../../fonctions/fonctions.js';
import Setting from '../../models/setting.model.js'
import moment from 'moment-timezone';
import * as faceapi from "@vladmandic/face-api";
import fs from "fs";
import path from "path";
import multer from 'multer';
import User from '../../models/user.model.js';
import { Canvas, Image, loadImage } from "canvas";

faceapi.env.monkeyPatch({ Canvas, Image });

// Fonction principale de reconnaissance faciale
async function optimizeImage(imageInput) {
    // Taille cible optimale pour face-api
    const TARGET_SIZE = 640;
    
    const canvas = new Canvas();
    const ctx = canvas.getContext('2d');
    
    // Calculer le ratio pour le redimensionnement
    const ratio = TARGET_SIZE / Math.max(imageInput.width, imageInput.height);
    const newWidth = Math.round(imageInput.width * ratio);
    const newHeight = Math.round(imageInput.height * ratio);
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Redimensionner l'image
    ctx.drawImage(imageInput, 0, 0, newWidth, newHeight);
    
    return canvas;
}

async function compareFaces(res, image1Buffer, image2Path) {
    const startTime = process.hrtime();
    
    try {
        // Charger les images
        const img1 = await loadImage(image1Buffer);
        const img2 = await loadImage(image2Path);
        
        // Optimiser les images
        const optimizedImg1 = await optimizeImage(img1);
        const optimizedImg2 = await optimizeImage(img2);
        
        // Détecter les visages et obtenir les descripteurs
        const detection1 = await faceapi.detectSingleFace(optimizedImg1)
            .withFaceLandmarks()
            .withFaceDescriptor();
        
        const detection2 = await faceapi.detectSingleFace(optimizedImg2)
            .withFaceLandmarks()
            .withFaceDescriptor();
            
        if (!detection1 || !detection2) {
            return res.status(400).json({ 
                success: false, 
                message: message.img_det_imp
            });
        }
        
        // Calculer la distance euclidienne entre les descripteurs
        const distance = faceapi.euclideanDistance(detection1.descriptor, detection2.descriptor);
            
        // Seuil de similitude (à ajuster selon vos besoins)
        const threshold = 0.6;
        
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const processingTime = seconds * 1000 + nanoseconds / 1000000;
        
        return {
            isMatch: distance < threshold,
            distance: distance,
            confidence: 1 - distance,
            processingTime: processingTime
        };
    } catch (error) {
        throw new Error(`Erreur lors de la comparaison: ${error.message}`);
    }
} 

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Limite à 10MB
});

export const createPresence = [
    upload.single('file'), async (req, res) => {
    const { utilisateur, matiere, niveau, annee, semestre, jour, heureDebut, heureFin } = req.body;
   
    try {
        // Vérification des champs obligatoires
        if (!utilisateur || !matiere || !niveau || !jour || !heureDebut || !heureFin || !annee || !semestre) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire,
            });
        }

        // Vérification de la validité des ObjectIds
        if (!mongoose.Types.ObjectId.isValid(utilisateur) || !mongoose.Types.ObjectId.isValid(matiere) || !mongoose.Types.ObjectId.isValid(niveau)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si une image est envoyée
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ success: false, message:message.img_rf_mqte});
        }

        const user = await User.findById(utilisateur).select("photo_profil");
        if(!user.photo_profil){
            return res.status(404).json({ success: false, message: message.pp_non_trouve });   
        }

       
         // Charger l'image de l'utilisateur depuis la base de données
        const fileName = path.basename(user.photo_profil);
        const filePath = path.join('./public/images/images_profile',fileName);  
        const utilisateurImagePath = path.resolve(filePath);
        if (!fs.existsSync(utilisateurImagePath)) {
            return res.status(404).json({ success: false, message: message.pp_non_trouve });
        }

        // Comparer les visages
        const result = await compareFaces(res, req.file.buffer, utilisateurImagePath);
        if(!result.isMatch){
            return res.status(400).json({ 
                success: false, 
                message: message.echec_rf 
            });
        }

        // Vérification si le jour envoyé correspond au jour actuel
        const currentDay = new Date().getDay(); // 0=Dimanche, 1=Lundi, ..., 6=Samedi
        if (jour !== currentDay) {
            return res.status(400).json({
                success: false,
                message: message.jour_non_correspondant,
            });
        }

        // Obtenir l'heure actuelle à Yaoundé, Cameroun
        const currentTime = moment().tz("Africa/Douala");
        const startCourseTime = moment.tz(heureDebut, "HH:mm", "Africa/Douala");
        const endCourseTime = moment.tz(heureFin, "HH:mm", "Africa/Douala");

        // Vérification si la présence est déjà marquée
        // Obtenir la date actuelle (au format "YYYY-MM-DD") en tenant compte de l'heure à Yaoundé, Cameroun
        const currentDate = moment().tz("Africa/Douala").startOf('day'); // Commencer à minuit de la journée actuelle

        // Définir la plage de dates (du début à la fin de la journée actuelle)
        const startOfDay = currentDate.toDate(); // Convertir en objet Date pour MongoDB
        const endOfDay = currentDate.endOf('day').toDate(); // Fin de la journée (23:59:59)

        // Rechercher une présence existante pour cet utilisateur, matière, niveau, année, semestre, jour, dans la plage de la journée actuelle
        const presenceExistante = await Presence.findOne({
            utilisateur: utilisateur._id,
            matiere: matiere,
            niveau,
            annee,
            semestre,
            jour,
            dateEnregistrement: { $gte: startOfDay, $lte: endOfDay }, // Filtrer entre le début et la fin de la journée
        });



        if (!presenceExistante) {
            // Marquer la présence au début du cours : 5 minutes avant et jusqu'à 15 minutes après le début du cours
            const startBuffer = startCourseTime.clone().subtract(5, 'minutes');
            const endBuffer = startCourseTime.clone().add(15, 'minutes');

            if (!currentTime.isBetween(startBuffer, endBuffer, null, '[]')) {
                return res.status(400).json({
                    success: false,
                    message: message.horaire_non_conforme,
                });
            }

            // Si pas de présence, marquer la présence au début du cours
            const nouvellePresence = new Presence({
                utilisateur: utilisateur._id,
                matiere: matiere,
                niveau,
                jour,
                heureDebut,
                heureFin,
                annee,
                semestre,
                debutCours: true, // Marquer présence au début du cours
            });

            const savePresence = await nouvellePresence.save();

            return res.status(200).json({
                success: true,
                message: message.presence_debut_enreg,
                data: savePresence,
            });
        } else if (presenceExistante && !presenceExistante.finCours) {
            // Marquer la fin du cours : 5 minutes avant et jusqu'à 5 minutes après la fin du cours
            const startEndBuffer = endCourseTime.clone().subtract(5, 'minutes');
            const endEndBuffer = endCourseTime.clone().add(5, 'minutes');

            if (!currentTime.isBetween(startEndBuffer, endEndBuffer, null, '[]')) {
                return res.status(400).json({
                    success: false,
                    message: message.horaire_non_conforme,
                });
            }

            // Si la présence au début du cours est déjà marquée, marquer la fin du cours
            presenceExistante.finCours = true;
            await presenceExistante.save();

            return res.status(200).json({
                success: true,
                message: message.presence_fin_enreg,
                data: presenceExistante,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: message.presence_confirm,
            });
        }
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la présence :', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
}];


export const updatePresence = async (req, res) => {
    const { presenceId } = req.params; // Récupérer l'ID de la présence depuis les paramètres de la requête
    const { enseignant, matiere, niveau, jour, heureDebut, heureFin, annee, semestre } = req.body;

    try {
        // Vérifier si l'ID de la présence est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(presenceId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Vérification des champs obligatoires
        if (!enseignant || !matiere || !niveau || !jour || !heureDebut || !heureFin || !annee || !semestre) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérifier si la présence existe
        const existingPresence = await Presence.findById(presenceId);
        if (!existingPresence) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee
            });
        }

        // Mise à jour de la présence
        existingPresence.enseignant = enseignant;
        existingPresence.matiere = matiere;
        existingPresence.jour = jour;
        existingPresence.heureDebut = heureDebut;
        existingPresence.heureFin = heureFin;
        existingPresence.niveau=niveau;
        existingPresence.annee=annee;
        existingPresence.semestre=semestre;

        // Enregistrer les modifications dans la base de données
        const updatedPresence = await existingPresence.save();

        res.status(200).json({
            success: true,
            message: message.mis_a_jour,
            data: updatedPresence,
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la présence :', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};


export const deletePresence = async (req, res) => {
    const { presenceId } = req.params; // Récupérer l'ID de la présence depuis les paramètres de la requête

    try {
        // Vérifier si l'ID de la présence est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(presenceId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Supprimer la présence par son ID
        const deletedPresence = await Presence.findByIdAndDelete(presenceId);
        if (!deletedPresence) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee
            });
        }

        res.status(200).json({
            success: true,
            message: message.supprimer_avec_success
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de la présence :', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};


export const getPresencesWithTotalHoraire = async (req, res) => {
    const { niveauId } = req.params;
    const { page = 1, pageSize = 10, annee, semestre } = req.query;

    try {
        const startIndex = (page - 1) * pageSize;

        // Filtre pour l'année, le semestre et le niveau
        const periodeFilter = {};
        if (annee && !isNaN(annee)) {
            periodeFilter.annee = parseInt(annee);
        }
        if (semestre && !isNaN(semestre)) {
            periodeFilter.semestre = parseInt(semestre);
        }
        if (niveauId) {
            periodeFilter.niveau = niveauId;
        }

        // Étape 1: Obtenir tous les enseignants principaux et suppléants du niveau pour le semestre et l'année
        const periodes = await Periode.find(periodeFilter)
            .select('enseignements')
            .populate({
                path: 'enseignements.enseignantPrincipal enseignements.enseignantSuppleant',
                select: 'nom prenom',
                strictPopulate: false
            });

        // Extraire tous les IDs d'enseignants principaux et suppléants
        const enseignantsIds = periodes.reduce((acc, periode) => {
            periode.enseignements.forEach(enseignement => {
                // Ajouter l'enseignant principal s'il est défini
                if (enseignement.enseignantPrincipal) {
                    acc.push(enseignement.enseignantPrincipal._id);
                }

                // Ajouter l'enseignant suppléant s'il est défini
                if (enseignement.enseignantSuppleant) {
                    acc.push(enseignement.enseignantSuppleant._id);
                }
            });
            return acc;
        }, []);

        // Supprimer les doublons
        const uniqueEnseignantsIds = [...new Set(enseignantsIds)];

        // Vérification des types et conversion en ObjectId si nécessaire
        const filter = { annee: parseInt(annee), semestre: parseInt(semestre) };
        if (mongoose.Types.ObjectId.isValid(niveauId)) {
            filter.niveau = niveauId;
        } else {
            return res.status(400).json({ success: false, message: message.identifiant_invalide });
        }

        // Étape 2: Obtenir les présences des enseignants avec totalHoraire
        const presences = await Presence.find(filter)
            .populate({ path: 'utilisateur', select: 'nom prenom', strictPopulate: false })
            .exec();
        // Calculer le totalHoraire pour chaque enseignant
        const enseignantHoraireMap = {};

        presences.forEach(presence => {
            const enseignantId = presence.utilisateur._id;
            const heureDebut = parseInt(presence.heureDebut.split(':')[0]);
            const minuteDebut = parseInt(presence.heureDebut.split(':')[1]);
            const heureFin = parseInt(presence.heureFin.split(':')[0]);
            const minuteFin = parseInt(presence.heureFin.split(':')[1]);

            // Calculer les heures et minutes de début et de fin en décimales
            const heureDebutDecimal = heureDebut + minuteDebut / 60;
            const heureFinDecimal = heureFin + minuteFin / 60;

            // Calculer la différence d'heures entre l'heure de début et l'heure de fin
            const differenceHeures = heureFinDecimal - heureDebutDecimal;

            if (enseignantHoraireMap[enseignantId]) {
                enseignantHoraireMap[enseignantId].totalHoraire += differenceHeures;
            } else {
                enseignantHoraireMap[enseignantId] = {
                    enseignant: {
                        _id: presence.utilisateur._id,
                        nom: presence.utilisateur.nom,
                        prenom: presence.utilisateur.prenom,
                    },
                    totalHoraire: differenceHeures
                };
            }
        });

        // Étape 3: Combiner les enseignants sans présence avec ceux qui en ont
        const enseignantsPresences = [];

        uniqueEnseignantsIds.forEach(enseignantId => {
            const presence = enseignantHoraireMap[enseignantId];

            if (presence) {
                enseignantsPresences.push(presence);
            } else {
                const periodeCorrespondante = periodes.find(p =>
                    p.enseignements.some(e =>
                        (e.enseignantPrincipal && e.enseignantPrincipal._id.equals(enseignantId)) ||
                        (e.enseignantSuppleant && e.enseignantSuppleant._id.equals(enseignantId))
                    )
                );

                const enseignantPrincipal = periodeCorrespondante?.enseignements.find(e => e.enseignantPrincipal && e.enseignantPrincipal._id.equals(enseignantId))?.enseignantPrincipal;
                const enseignantSuppleant = periodeCorrespondante?.enseignements.find(e => e.enseignantSuppleant && e.enseignantSuppleant._id.equals(enseignantId))?.enseignantSuppleant;

                const enseignant = enseignantPrincipal || enseignantSuppleant;
                if (enseignant) {
                    enseignantsPresences.push({
                        enseignant: {
                            _id: enseignant._id,
                            nom: enseignant.nom,
                            prenom: enseignant.prenom
                        },
                        totalHoraire: 0
                    });
                }
            }
        });

        // Pagination
        const paginatedEnseignants = enseignantsPresences.slice(startIndex, startIndex + parseInt(pageSize));
        const totalItems = enseignantsPresences.length;
        const totalPages = Math.ceil(totalItems / parseInt(pageSize));

        res.status(200).json({
            success: true,
            data: {
                presencePaies: paginatedEnseignants,
                totalPages: totalPages,
                currentPage: page,
                totalItems: totalItems,
                pageSize: pageSize
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des présences :', error);
        res.status(500).json({ success: false, message: "Erreur du serveur" });
    }
};


export const searchEnseignantPresence = async (req, res) => {
    const { searchString, limit = 5} = req.query;

    try {
        const startIndex = (1 - 1) * limit;

        

        // Étape 1: Obtenir les enseignants principaux et suppléants en fonction du filtre
        const periodes = await Periode.find({})
            .select('enseignements')
            .populate({
                path: 'enseignements.enseignantPrincipal enseignements.enseignantSuppleant',
                select: 'nom prenom',
                strictPopulate: false
            });

        // Extraire les enseignants qui correspondent au searchString
        const enseignantsIds = periodes.reduce((acc, periode) => {
            periode.enseignements.forEach(enseignement => {
                if (enseignement.enseignantPrincipal &&
                    (enseignement.enseignantPrincipal.nom.toLowerCase().includes(searchString.toLowerCase()) ||
                     enseignement.enseignantPrincipal.prenom.toLowerCase().includes(searchString.toLowerCase()))) {
                    acc.push(enseignement.enseignantPrincipal._id);
                }
                if (enseignement.enseignantSuppleant &&
                    (enseignement.enseignantSuppleant.nom.toLowerCase().includes(searchString.toLowerCase()) ||
                     enseignement.enseignantSuppleant.prenom.toLowerCase().includes(searchString.toLowerCase()))) {
                    acc.push(enseignement.enseignantSuppleant._id);
                }
            });
            return acc;
        }, []);

        const uniqueEnseignantsIds = [...new Set(enseignantsIds)];

        // Étape 2: Obtenir les présences des enseignants avec totalHoraire
        const presences = await Presence.find({ 'utilisateur._id': { $in: uniqueEnseignantsIds } })
            .populate('utilisateur', 'nom prenom')
            .exec();

        // Calculer le totalHoraire pour chaque enseignant
        const enseignantHoraireMap = {};

        presences.forEach(presence => {
            const enseignantId = presence.utilisateur._id;
            const heureDebut = parseInt(presence.heureDebut.split(':')[0]);
            const minuteDebut = parseInt(presence.heureDebut.split(':')[1]);
            const heureFin = parseInt(presence.heureFin.split(':')[0]);
            const minuteFin = parseInt(presence.heureFin.split(':')[1]);

            const heureDebutDecimal = heureDebut + minuteDebut / 60;
            const heureFinDecimal = heureFin + minuteFin / 60;
            const differenceHeures = heureFinDecimal - heureDebutDecimal;

            if (enseignantHoraireMap[enseignantId]) {
                enseignantHoraireMap[enseignantId].totalHoraire += differenceHeures;
            } else {
                enseignantHoraireMap[enseignantId] = {
                    enseignant: {
                        _id: presence.utilisateur._id,
                        nom: presence.utilisateur.nom,
                        prenom: presence.utilisateur.prenom,
                    },
                    totalHoraire: differenceHeures
                };
            }
        });

        // Ajouter les enseignants sans présence
        const enseignantsPresences = [];

        uniqueEnseignantsIds.forEach(enseignantId => {
            const presence = enseignantHoraireMap[enseignantId];

            if (presence) {
                enseignantsPresences.push(presence);
            } else {
                const periodeCorrespondante = periodes.find(p =>
                    p.enseignements.some(e =>
                        (e.enseignantPrincipal && e.enseignantPrincipal._id.equals(enseignantId)) ||
                        (e.enseignantSuppleant && e.enseignantSuppleant._id.equals(enseignantId))
                    )
                );

                const enseignantPrincipal = periodeCorrespondante?.enseignements.find(e => e.enseignantPrincipal && e.enseignantPrincipal._id.equals(enseignantId))?.enseignantPrincipal;
                const enseignantSuppleant = periodeCorrespondante?.enseignements.find(e => e.enseignantSuppleant && e.enseignantSuppleant._id.equals(enseignantId))?.enseignantSuppleant;

                const enseignant = enseignantPrincipal || enseignantSuppleant;
                if (enseignant) {
                    enseignantsPresences.push({
                        enseignant: {
                            _id: enseignant._id,
                            nom: enseignant.nom,
                            prenom: enseignant.prenom
                        },
                        totalHoraire: 0
                    });
                }
            }
        });

        // Pagination
        const paginatedEnseignants = enseignantsPresences.slice(startIndex, startIndex + parseInt(limit));
        const totalItems = enseignantsPresences.length;
        const totalPages = Math.ceil(totalItems / parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                presencePaies: paginatedEnseignants,
                totalPages: totalPages,
                currentPage: 1,
                totalItems: totalItems,
                pageSize: limit
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des présences :', error);
        res.status(500).json({ success: false, message: 'Erreur du serveur' });
    }
};


export const generateListPresenceByNiveau = async (req, res)=>{
    const { niveauId } = req.params;
    const { annee, semestre, langue, departement, section, cycle, niveau, fileType } = req.query;

    try{
        // Filtre pour l'année, le semestre et le niveau
        const periodeFilter = {};
        if (annee && !isNaN(annee)) {
            periodeFilter.annee = parseInt(annee);
        }
        if (semestre && !isNaN(semestre)) {
            periodeFilter.semestre = parseInt(semestre);
        }
        if (niveauId) {
            periodeFilter.niveau = niveauId;
        }

        // Étape 1: Obtenir tous les enseignants principaux et suppléants du niveau pour le semestre et l'année
        const periodes = await Periode.find(periodeFilter)
            .select('enseignements')
            .populate({
                path: 'enseignements.enseignantPrincipal enseignements.enseignantSuppleant',
                select: 'nom prenom',
                strictPopulate: false
            });

        // Extraire tous les IDs d'enseignants principaux et suppléants
        const enseignantsIds = periodes.reduce((acc, periode) => {
            periode.enseignements.forEach(enseignement => {
                // Ajouter l'enseignant principal s'il est défini
                if (enseignement.enseignantPrincipal) {
                    acc.push(enseignement.enseignantPrincipal._id);
                }

                // Ajouter l'enseignant suppléant s'il est défini
                if (enseignement.enseignantSuppleant) {
                    acc.push(enseignement.enseignantSuppleant._id);
                }
            });
            return acc;
        }, []);

        // Supprimer les doublons
        const uniqueEnseignantsIds = [...new Set(enseignantsIds)];

        // Vérification des types et conversion en ObjectId si nécessaire
        const filter = { annee: parseInt(annee), semestre: parseInt(semestre) };
        if (mongoose.Types.ObjectId.isValid(niveauId)) {
            filter.niveau = niveauId;
        } else {
            return res.status(400).json({ success: false, message: message.identifiant_invalide });
        }

        // Étape 2: Obtenir les présences des enseignants avec totalHoraire
        const presences = await Presence.find(filter)
            .populate({ path: 'utilisateur', select: 'nom prenom', strictPopulate: false })
            .exec();

        // Calculer le totalHoraire pour chaque enseignant
        const enseignantHoraireMap = {};

        presences.forEach(presence => {
            const enseignantId = presence.utilisateur._id;
            const heureDebut = parseInt(presence.heureDebut.split(':')[0]);
            const minuteDebut = parseInt(presence.heureDebut.split(':')[1]);
            const heureFin = parseInt(presence.heureFin.split(':')[0]);
            const minuteFin = parseInt(presence.heureFin.split(':')[1]);

            // Calculer les heures et minutes de début et de fin en décimales
            const heureDebutDecimal = heureDebut + minuteDebut / 60;
            const heureFinDecimal = heureFin + minuteFin / 60;

            // Calculer la différence d'heures entre l'heure de début et l'heure de fin
            const differenceHeures = heureFinDecimal - heureDebutDecimal;

            if (enseignantHoraireMap[enseignantId]) {
                enseignantHoraireMap[enseignantId].totalHoraire += differenceHeures;
            } else {
                enseignantHoraireMap[enseignantId] = {
                    enseignant: {
                        _id: presence.utilisateur._id,
                        nom: presence.utilisateur.nom,
                        prenom: presence.utilisateur.prenom,
                    },
                    totalHoraire: differenceHeures
                };
            }
        });

        // Étape 3: Combiner les enseignants sans présence avec ceux qui en ont
        const enseignantsPresences = [];

        uniqueEnseignantsIds.forEach(enseignantId => {
            const presence = enseignantHoraireMap[enseignantId];

            if (presence) {
                enseignantsPresences.push(presence);
            } else {
                const periodeCorrespondante = periodes.find(p =>
                    p.enseignements.some(e =>
                        (e.enseignantPrincipal && e.enseignantPrincipal._id.equals(enseignantId)) ||
                        (e.enseignantSuppleant && e.enseignantSuppleant._id.equals(enseignantId))
                    )
                );

                const enseignantPrincipal = periodeCorrespondante?.enseignements.find(e => e.enseignantPrincipal && e.enseignantPrincipal._id.equals(enseignantId))?.enseignantPrincipal;
                const enseignantSuppleant = periodeCorrespondante?.enseignements.find(e => e.enseignantSuppleant && e.enseignantSuppleant._id.equals(enseignantId))?.enseignantSuppleant;

                const enseignant = enseignantPrincipal || enseignantSuppleant;
                if (enseignant) {
                    enseignantsPresences.push({
                        enseignant: {
                            _id: enseignant._id,
                            nom: enseignant.nom,
                            prenom: enseignant.prenom
                        },
                        totalHoraire: 0
                    });
                }
            }
        });

        let settings = await Setting.find().select('tauxHoraire');
        let setting = null;
        if(settings.length>0){
            setting=settings[0]
        }
        const tauxHoraire = setting?.tauxHoraire || 0;
        if(fileType.toLowerCase() === 'pdf'){
            let filePath='./templates/templates_fr/template_presence_fr.html';
            if(langue==='en'){
                filePath='./templates/templates_en/template_presence_en.html';
            }
            const htmlContent = await fillTemplate( langue, departement, section, cycle, niveau, enseignantsPresences, filePath, annee, semestre, tauxHoraire);

            // Générer le PDF à partir du contenu HTML
            generatePDFAndSendToBrowser(htmlContent, res, 'landscape');
        }else{
            exportToExcel(enseignantsPresences, langue, res, tauxHoraire);
        }
    }catch(error){
        console.log(error);
        return res.status(500).json({success:false, message: message.erreurServeur });
    }
}

const exportToExcel = async (enseignantsPresences, langue, res, tauxHoraire ) => {
    if (enseignantsPresences) {
        // Créer un nouveau classeur Excel
        const workbook = new ExcelJS.Workbook();
        // Ajouter une nouvelle feuille de calcul
        const worksheet = workbook.addWorksheet('Sheet1');

        // Définir les en-têtes en fonction de la langue
        
        const headers = langue === 'fr' 
                ? ['Matricule', 'Nom', 'Prénom', 'Taux horaire', 'Nombre d\'heure', 'Gratification brute', 'IRNC', 'Gratification nette']
                : ['Regist.', 'Last Name', 'First Name', 'Hourly rate', 'Number of hours', 'Gross bonus', 'IRNC', 'Net bonus'];
        

        // Ajouter les en-têtes à la feuille de calcul
        worksheet.addRow(headers);
        
        // Ajouter les données des étudiants
        enseignantsPresences.forEach(enseignantsPresence => {
            const montantBrut = calculGrossBonus(enseignantsPresence?.totalHoraire || 0, tauxHoraire);
            const irnc = calculIRNC(montantBrut);
            const montantNet = calculNetBonus(montantBrut, irnc);
            worksheet.addRow([
                enseignantsPresence.enseignant?.matricule || "", enseignantsPresence.enseignant?.nom || "", enseignantsPresence.enseignant?.prenom || "", tauxHoraire,
                enseignantsPresence.totalHoraire, montantBrut, irnc, montantNet

            ]);
            
        });

        // Définir les en-têtes de réponse pour le téléchargement du fichier
        res.setHeader('Content-Disposition', `attachment; filename=presence_${langue}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Envoyer le fichier Excel en réponse
        await workbook.xlsx.write(res);
        res.end(); // Terminer la réponse après l'écriture du fichier
    } else {
        // Gérer le cas où `etudiants` est indéfini
        res.status(400).json({ success: false, message: message.pas_de_donnees });
    }
};

async function fillTemplate (departement, section, cycle, niveau, langue, enseignantsPresences, filePath, annee, semestre, tauxHoraire) {
    try {
        const htmlString = await loadHTML(filePath);
        const $ = cheerio.load(htmlString); // Charger le template HTML avec cheerio
        const body = $('body');
        body.find('#division-fr').text(departement.libelleFr);
        body.find('#division-en').text(departement.libelleEn);
        body.find('#section-fr').text(section.libelleFr);
        body.find('#section-en').text(section.libelleEn);
        body.find('#cycle-niveau').text(cycle.code+""+niveau.code);
        body.find('#annee').text(formatYear(parseInt(annee)));
        body.find('#semestre').text(semestre);
        const userTable = $('#table-enseignant');
        const rowTemplate = $('.row_template');
        let i = 1;
        for (const enseignantsPresence of enseignantsPresences) {
            const clonedRow = rowTemplate.clone();
            const montantBrut = calculGrossBonus(enseignantsPresence?.totalHoraire || 0, tauxHoraire);
            const irnc = calculIRNC(montantBrut);
            const montantNet = calculNetBonus(montantBrut, irnc);
            clonedRow.find('#num').text(i);
            clonedRow.find('#matricule').text(enseignantsPresence.enseignant?.matricule || "");
            clonedRow.find('#nom').text(enseignantsPresence.enseignant?.nom || "");
            clonedRow.find('#prenom').text(enseignantsPresence.enseignant?.prenom || "");
            clonedRow.find('#taux_horaire').text(tauxHoraire);
            clonedRow.find('#nb_heure').text(enseignantsPresence?.totalHoraire || 0);
            clonedRow.find('#montant_brut').text(montantBrut);
            clonedRow.find('#irnc').text(irnc);
            clonedRow.find('#montant_net').text(montantNet);
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




