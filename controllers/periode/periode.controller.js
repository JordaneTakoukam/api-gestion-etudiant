import Periode from '../../models/periode.model.js';
import Matiere from '../../models/matiere.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import moment from 'moment';
import Setting from '../../models/setting.model.js';
import { formatDateFr, formatNameSurname, formatYear, generatePDFAndSendToBrowser, loadHTML, premierElement } from '../../fonctions/fonctions.js';
import cheerio from 'cheerio';
import ExcelJS from 'exceljs';

// Définir la locale française pour moment
moment.locale('fr');

//jours de la semaine
const jours = [
    { libelleFr: 'Lundi', libelleEn: 'Monday' },
    { libelleFr: 'Mardi', libelleEn: 'Tuesday' },
    { libelleFr: 'Mercredi', libelleEn: 'Wednesday' },
    { libelleFr: 'Jeudi', libelleEn: 'Thursday' },
    { libelleFr: 'Vendredi', libelleEn: 'Friday' },
    { libelleFr: 'Samedi', libelleEn: 'Saturday' },
    { libelleFr: 'Dimanche', libelleEn: 'Sunday' },
];

// create
export const createPeriode = async (req, res) => {
    const {
        jour,
        semestre,
        annee,
        niveau,
        matieres,
        typesEnseignements,
        enseignantsPrincipaux,
        enseignantsSuppleants = [],
        heureDebut,
        heureFin,
        sallesCours,
        pause
    } = req.body;

    try {
        // Validation des champs requis
        const requiredFields = pause 
            ? ['jour', 'semestre', 'annee', 'niveau', 'heureDebut', 'heureFin'] 
            : ['jour', 'semestre', 'annee', 'niveau', 'matieres', 'typesEnseignements', 'enseignantsPrincipaux', 'heureDebut', 'heureFin', 'sallesCours'];

        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: message.champ_obligatoire,
                });
            }
        }

        // Validation des ObjectIDs
        const validateArrayIds = (array, messageKey) => {
            for (const item of array) {
                const id = item._id || item;  // Support both arrays of objects or IDs
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return res.status(400).json({
                        success: false,
                        message: message[messageKey],
                    });
                }
            }
        };

        if (!pause) {
            validateArrayIds(matieres, 'identifiant_invalide');
            validateArrayIds(typesEnseignements, 'identifiant_invalide');
            validateArrayIds(enseignantsPrincipaux, 'identifiant_invalide');
            validateArrayIds(enseignantsSuppleants, 'identifiant_invalide');
            validateArrayIds(sallesCours, 'identifiant_invalide');
        }

        // Validation des heures
        const heureRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!heureRegex.test(heureDebut) || !heureRegex.test(heureFin)) {
            return res.status(400).json({
                success: false,
                message: message.heure_invalide,
            });
        }

        // Convertir les heures en minutes pour faciliter la comparaison
        const convertToMinutes = (time) => {
            const [hours, minutes] = time.split(':');
            return parseInt(hours) * 60 + parseInt(minutes);
        };

        const startMinutes = convertToMinutes(heureDebut);
        const endMinutes = convertToMinutes(heureFin);

        // Vérifier si l'heure de début est avant l'heure de fin
        if (startMinutes >= endMinutes) {
            return res.status(400).json({
                success: false,
                message: message.heure_debut_fin_invalides,
            });
        }

        // Vérifier les conflits pour les enseignants et les salles
        const checkConflicts = async () => {
            const conflictingPeriodes = await Periode.find({
                jour,
                semestre,
                annee,
                $or: [
                    {
                        heureDebut: { $lt: heureFin },
                        heureFin: { $gt: heureDebut }
                    }
                ]
            });

            // Vérifier les conflits pour les enseignants principaux et suppléants
            const allEnseignants = [...enseignantsPrincipaux, ...enseignantsSuppleants];
            for (const enseignant of allEnseignants) {
                const enseignantConflict = conflictingPeriodes.some(periode => 
                    periode.enseignantsPrincipaux.some(e => e._id.toString() === enseignant._id.toString()) ||
                    (periode.enseignantsSuppleants && periode.enseignantsSuppleants.some(e => e._id.toString() === enseignant._id.toString()))
                );
                if (enseignantConflict) {
                    return { conflict: true, type: 'enseignant' };
                }
            }

            // Vérifier les conflits pour les salles
            for (const salle of sallesCours) {
                const salleConflict = conflictingPeriodes.some(periode => 
                    periode.sallesCours.includes(salle)
                );
                if (salleConflict) {
                    return { conflict: true, type: 'salle' };
                }
            }

            return { conflict: false };
        };

        const conflictCheckResult = await checkConflicts();
        if (conflictCheckResult.conflict) {
            return res.status(400).json({
                success: false,
                message: conflictCheckResult.type === 'enseignant' ? message.existe_enseignant_cours : message.existe_salle_cours_programme,
            });
        }

        // Création ou mise à jour de la période
        let existingPeriode = await Periode.findOne({ annee, semestre, niveau, jour, heureDebut, heureFin });
        if (existingPeriode) {
            // Ajouter les informations sans doublons
            matieres.forEach(matiere => {
                if (!existingPeriode.matieres.some(m => m._id.toString() === matiere._id.toString())) {
                    existingPeriode.matieres.push(matiere);
                }
            });
            enseignantsPrincipaux.forEach(enseignant => {
                if (!existingPeriode.enseignantsPrincipaux.some(e => e._id.toString() === enseignant._id.toString())) {
                    existingPeriode.enseignantsPrincipaux.push(enseignant);
                }
            });
            enseignantsSuppleants.forEach(suppleant => {
                if (!existingPeriode.enseignantsSuppleants.some(es => es._id.toString() === suppleant._id.toString())) {
                    existingPeriode.enseignantsSuppleants.push(suppleant);
                }
            });
            existingPeriode.typesEnseignements = [...new Set([...existingPeriode.typesEnseignements, ...typesEnseignements])];
            existingPeriode.sallesCours = [...new Set([...existingPeriode.sallesCours, ...sallesCours])];
            existingPeriode.heureDebut = heureDebut;
            existingPeriode.heureFin = heureFin;
            existingPeriode.pause = pause;

            const updatedPeriode = await existingPeriode.save();
            const populatedPeriode = await Periode.populate(updatedPeriode, [
                { path: 'matieres', select: '_id code libelleFr libelleEn' },
                { path: 'enseignantsPrincipaux', select: '_id nom prenom' },
                { path: 'enseignantsSuppleants', select: '_id nom prenom' }
            ]);

            return res.status(200).json({
                success: true,
                message: message.ajouter_avec_success,
                data: populatedPeriode
            });
        } else {
            const newPeriodeCours = new Periode({
                jour, semestre, annee, pause, niveau, matieres,
                typesEnseignements, heureDebut, heureFin, sallesCours,
                enseignantsPrincipaux, enseignantsSuppleants
            });

            const savedPeriode = await newPeriodeCours.save();
            const populatedPeriode = await Periode.populate(savedPeriode, [
                { path: 'matieres', select: '_id code libelleFr libelleEn' },
                { path: 'enseignantsPrincipaux', select: '_id nom prenom' },
                { path: 'enseignantsSuppleants', select: '_id nom prenom' }
            ]);

            return res.status(201).json({
                success: true,
                message: message.ajouter_avec_success,
                data: populatedPeriode
            });
        }
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la période de cours :', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};


// update
export const updatePeriode = async (req, res) => {
    const {periodeId} = req.params;
    const {
        jour,
        semestre,
        annee,
        niveau,
        matieres,
        typesEnseignements,
        enseignantsPrincipaux,
        enseignantsSuppleants,
        heureDebut,
        heureFin,
        sallesCours,
        pause
    } = req.body;

    try {
        // Vérifier l'existence de l'ID de la période
        if (!mongoose.Types.ObjectId.isValid(periodeId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }
        // Validation des champs
        const requiredFields = pause 
            ? ['jour', 'semestre', 'annee', 'niveau', 'heureDebut', 'heureFin'] 
            : ['jour', 'semestre', 'annee', 'niveau', 'matieres', 'typesEnseignements', 'enseignantsPrincipaux', 'heureDebut', 'heureFin', 'sallesCours'];

        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: message.champ_obligatoire,
                });
            }
        }

        if (!periodeId) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Validation des ObjectIDs
        const validateArrayIds = (array, messageKey) => {
            for (const item of array) {
                const id = item._id || item;  // Support both arrays of objects or IDs
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return res.status(400).json({
                        success: false,
                        message: message[messageKey],
                    });
                }
            }
        };

        if (!pause) {
            validateArrayIds(matieres, 'identifiant_invalide');
            validateArrayIds(typesEnseignements, 'identifiant_invalide');
            validateArrayIds(enseignantsPrincipaux, 'identifiant_invalide');
            validateArrayIds(enseignantsSuppleants, 'identifiant_invalide');
            validateArrayIds(sallesCours, 'identifiant_invalide');
        }

        // Validation des heures
        const heureRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!heureRegex.test(heureDebut) || !heureRegex.test(heureFin)) {
            return res.status(400).json({
                success: false,
                message: message.heure_invalide,
            });
        }

        // Convertir les heures en minutes pour faciliter la comparaison
        const convertToMinutes = (time) => {
            const [hours, minutes] = time.split(':');
            return parseInt(hours) * 60 + parseInt(minutes);
        };

        const startMinutes = convertToMinutes(heureDebut);
        const endMinutes = convertToMinutes(heureFin);

        // Vérifier si l'heure de début est avant l'heure de fin
        if (startMinutes >= endMinutes) {
            return res.status(400).json({
                success: false,
                message: message.heure_debut_fin_invalides,
            });
        }

        // Vérifier les conflits pour les enseignants et les salles
        const checkConflicts = async () => {
            const conflictingPeriodes = await Periode.find({
                jour,
                semestre,
                annee,
                _id: { $ne : periodeId },
                $or: [
                    {
                        heureDebut: { $lt: heureFin },
                        heureFin: { $gt: heureDebut }
                    }
                ]
            });

            // Vérifier les conflits pour les enseignants principaux et suppléants
            const allEnseignants = [...enseignantsPrincipaux, ...enseignantsSuppleants];
            for (const enseignant of allEnseignants) {
                const enseignantConflict = conflictingPeriodes.some(periode => 
                    periode.enseignantsPrincipaux.some(e => e._id.toString() === enseignant._id.toString()) ||
                    (periode.enseignantsSuppleants && periode.enseignantsSuppleants.some(e => e._id.toString() === enseignant._id.toString()))
                );
                if (enseignantConflict) {
                    return { conflict: true, type: 'enseignant' };
                }
            }

            // Vérifier les conflits pour les salles
            for (const salle of sallesCours) {
                const salleConflict = conflictingPeriodes.some(periode => 
                    periode.sallesCours.includes(salle)
                );
                if (salleConflict) {
                    return { conflict: true, type: 'salle' };
                }
            }

            return { conflict: false };
        };

        const conflictCheckResult = await checkConflicts();
        if (conflictCheckResult.conflict) {
            return res.status(400).json({
                success: false,
                message: conflictCheckResult.type === 'enseignant' ? message.existe_enseignant_cours : message.existe_salle_cours_programme,
            });
        }

        // Mise à jour de la période existante
        let existingPeriode = await Periode.findById(periodeId);
        if (!existingPeriode) {
            return res.status(404).json({
                success: false,
                message: message.periode_non_trouve,
            });
        }

        existingPeriode.jour = jour;
        existingPeriode.semestre = semestre;
        existingPeriode.annee = annee;
        existingPeriode.niveau = niveau;
        existingPeriode.matieres = matieres;
        existingPeriode.typesEnseignements = typesEnseignements;
        existingPeriode.enseignantsPrincipaux = enseignantsPrincipaux;
        existingPeriode.enseignantsSuppleants = enseignantsSuppleants || [];
        existingPeriode.sallesCours = sallesCours;
        existingPeriode.heureDebut = heureDebut;
        existingPeriode.heureFin = heureFin;
        existingPeriode.pause = pause;

        // Sauvegarde des modifications
        const updatedPeriode = await existingPeriode.save();
        const populatedPeriode = await Periode.populate(updatedPeriode, [
            { path: 'matieres', select: '_id code libelleFr libelleEn' },
            { path: 'enseignantsPrincipaux', select: '_id nom prenom' },
            { path: 'enseignantsSuppleants', select: '_id nom prenom' }
        ]);

        return res.status(200).json({
            success: true,
            message: message.mis_a_jour,
            data: populatedPeriode
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la période de cours :', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};


export const deletePeriode = async (req, res) => {
    const { periodeId } = req.params;
    const { matiereIndex } = req.query; // On reçoit l'index de la matière à supprimer

    try {
        // Vérifier si la période existe
        const periode = await Periode.findById(periodeId);
        if (!periode) {
            return res.status(404).json({
                success: false,
                message: message.periode_non_trouve,
            });
        }

        // Si la période est une pause ou si elle ne contient qu'une seule matière, supprimer la période
        if (periode.pause || periode.matieres.length === 1) {
            await Periode.findByIdAndDelete(periodeId);
            return res.status(200).json({
                success: true,
                message: message.supprimer_avec_success,
            });
        }

        // Vérifier que l'index de la matière est valide
        if (matiereIndex < 0 || matiereIndex >= periode.matieres.length) {
            return res.status(400).json({
                success: false,
                message: message.matiere_non_trouvee,
            });
        }

        // Supprimer la matière en fonction de l'index
        periode.matieres.splice(matiereIndex, 1);

        // Supprimer les entités associées à cette matière en utilisant le même index
        if (periode.typesEnseignements.length > matiereIndex) {
            periode.typesEnseignements.splice(matiereIndex, 1);
        }
        
        if (periode.sallesCours.length > matiereIndex) {
            periode.sallesCours.splice(matiereIndex, 1);
        }
        
        if (periode.enseignantsPrincipaux.length > matiereIndex) {
            periode.enseignantsPrincipaux.splice(matiereIndex, 1);
        }

        if (periode.enseignantsSuppleants && periode.enseignantsSuppleants.length > matiereIndex) {
            periode.enseignantsSuppleants.splice(matiereIndex, 1);
        }

        // Sauvegarder la période mise à jour
        const updatedPeriode = await periode.save();
        const populatedPeriode = await Periode.populate(updatedPeriode, [
            { path: 'matieres', select: '_id code libelleFr libelleEn' },
            { path: 'enseignantsPrincipaux', select: '_id nom prenom' },
            { path: 'enseignantsSuppleants', select: '_id nom prenom' }
        ]);
        return res.status(200).json({
            success: true,
            message: message.supprimer_avec_success,
            data: populatedPeriode,
        });

    } catch (error) {
        console.error('Erreur lors de la suppression de la matière :', error);
        return res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};



export const getPeriodesByNiveau = async (req, res) => {
    const { niveauId } = req.params;
    const { annee, semestre } = req.query;

    try {
        // Vérifier si l'ID du niveau est valide
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }

        // Création du filtre initial pour le niveau
        const filter = { niveau: niveauId };

        // Si une année est spécifiée dans la requête, l'utiliser
        if (annee && !isNaN(annee)) {
            filter.annee = parseInt(annee);
            // const periodesCurrentYear = await Periode.findOne({ niveau: niveauId, annee }).exec();
            // if (!periodesCurrentYear) {
            //     // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
            //     let found = false;
            //     let previousYear = parseInt(annee) - 1;
            //     while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
            //         const periodesPreviousYear = await Periode.findOne({ niveau: niveauId, annee: previousYear }).exec();
            //         if (periodesPreviousYear) {
            //             filter.annee = previousYear;
            //             found = true;
            //         } else {
            //             previousYear--;
            //         }
            //     }
            // } 
        }

        // Si un semestre est spécifié dans la requête, l'utiliser
        if (semestre && !isNaN(semestre)) {
            filter.semestre = parseInt(semestre);
        }


        // Rechercher les périodes en fonction du filtre
        const periodes = await Periode.find(filter)
            .populate({
                path: 'matieres',
                select: '_id code libelleFr libelleEn typesEnseignement'
            })
            .populate({
                path: 'enseignantsPrincipaux',
                select: '_id nom prenom'
            })
            .populate({
                path: 'enseignantsSuppleants',
                select: '_id nom prenom'
            })
            .exec();

        // Envoyer la réponse avec les données
        res.status(200).json({ 
            success: true,
            data: {
                periodes,
                currentPage: 0,
                totalPages: 0,
                totalItems: periodes.length,
                pageSize: periodes.length
            }
        });
    } catch (error) {
        // Gérer les erreurs
        console.error('Erreur lors de la récupération des périodes par niveau :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
}

export const getPeriodesAVenirByNiveau = async (req, res) => {
    const { niveauId } = req.params;
    const { nbElement = 5, annee = 2023, semestre = 1 } = req.query;
    
    try {
        // Récupérer toutes les périodes de cours pour le niveau spécifié
       // Création du filtre initial pour le niveau
       const filter = { niveau: niveauId };

       // Si une année est spécifiée dans la requête, l'utiliser
       if (annee && !isNaN(annee)) {
           filter.annee = parseInt(annee);
        //    const periodesCurrentYear = await Periode.findOne({ niveau: niveauId, annee }).exec();
        //    if (!periodesCurrentYear) {
        //        // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
        //        let found = false;
        //        let previousYear = parseInt(annee) - 1;
        //        while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
        //            const periodesPreviousYear = await Periode.findOne({ niveau: niveauId, annee: previousYear }).exec();
        //            if (periodesPreviousYear) {
        //                filter.annee = previousYear;
        //                found = true;
        //            } else {
        //                previousYear--;
        //            }
        //        }
        //    } 
       }

       // Si un semestre est spécifié dans la requête, l'utiliser
       if (semestre && !isNaN(semestre)) {
           filter.semestre = parseInt(semestre);
       }


       // Rechercher les périodes en fonction du filtre
       const periodes = await Periode.find(filter)
           .populate({
               path: 'matieres',
               select: 'code libelleFr libelleEn'
           })
           .populate({
               path: 'enseignantsPrincipaux',
               select: 'nom prenom'
           })
           .populate({
               path: 'enseignantsSuppleants',
               select: 'nom prenom'
           })
           .exec();
           

        // Déterminer le jour actuel
        const now = new Date();
        const currentDayIndex = now.getDay(); // 0 pour dimanche, 1 pour lundi, ..., 6 pour samedi

        // Diviser les périodes en groupes par jour de la semaine
        const periodesParJour = {};
        for (let i = 0; i < 7; i++) {
            periodesParJour[i] = [];
        }
        periodes.forEach(periode => {
            const [heure, minutes] = periode.heureDebut.split(':');
            const heureDebut = new Date();
            heureDebut.setHours(parseInt(heure));
            heureDebut.setMinutes(parseInt(minutes));
            const jourIndex = periode.jour == 1 ? 1 :
                periode.jour == 2 ? 2 :
                periode.jour == 3 ? 3 :
                periode.jour == 4 ? 4 :
                periode.jour == 5 ? 5 :
                periode.jour == 6 ? 6 :
                0; // Dimanche
            
                 // Vérifier si l'heure de début est déjà passée
                if (heureDebut <= now) {
                    // Si l'heure de début est passée, ajoutez la période à la fin de la liste
                    periodesParJour[jourIndex].push(periode);
                } else {
                    // Sinon, ajoutez-la au début de la liste
                    periodesParJour[jourIndex].unshift(periode);
                }
            
        });
        // Concaténer les groupes de périodes dans l'ordre de la semaine, en commençant par le jour actuel
        let periodesAVenir = [];
        let periodesJourCourantDejaPasse = [];
        periodesParJour[currentDayIndex].forEach(periode => {
            const [heure, minutes] = periode.heureDebut.split(':');
            const heureDebut = new Date();
            heureDebut.setHours(parseInt(heure));
            heureDebut.setMinutes(parseInt(minutes));
            
            // Vérifier si l'heure de début est déjà passée
            if (heureDebut <= now) {
                // Si oui, ajouter la période à la liste periodesJourCourantDejaPasse
                periodesJourCourantDejaPasse.push(periode);
            } else {
                // Sinon, ajouter la période à la liste periodesAVenir
                periodesAVenir.push(periode);
            }
        });
        
        for (let i = currentDayIndex+1; i <= 6; i++) {
            periodesAVenir = periodesAVenir.concat(periodesParJour[i]);
        }
        for (let i = 0; i < currentDayIndex; i++) {
            periodesAVenir = periodesAVenir.concat(periodesParJour[i]);
        }
        periodesAVenir = periodesAVenir.concat(periodesJourCourantDejaPasse);
        
        // Filtrer les périodes null
        periodesAVenir = periodesAVenir.filter(periode => periode !== null);
        
        // Limiter le nombre de périodes à renvoyer
        const periodesAVenirLimitees = periodesAVenir.slice(0, nbElement);
        
        res.status(200).json({ 
            success: true,
            data: { periodes: periodesAVenirLimitees }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des périodes de cours à venir pour le niveau :', error);
        res.status(500).json({ 
            success: false,
            message: 'Une erreur est survenue lors de la récupération des périodes de cours à venir.'
        });
    }
}

// export const getPeriodesAVenirByEnseignant = async (req, res) => {
//     const { enseignantId } = req.params;
//     const { nbElement = 5, annee = 2023, semestre = 1 } = req.query;

//     try {
//         // Récupérer toutes les périodes de cours pour l'enseignant spécifié
//         const filter = {
//             $or: [
//                 { enseignantPrincipal: enseignantId },
//                 { enseignantSuppleant: enseignantId }
//             ]
//         };

//         // Si une année est spécifiée dans la requête, l'utiliser
//         if (annee && !isNaN(annee)) {
//             filter.annee = parseInt(annee);
//         }

//         // Si un semestre est spécifié dans la requête, l'utiliser
//         if (semestre && !isNaN(semestre)) {
//             filter.semestre = parseInt(semestre);
//         }

//         // Rechercher les périodes en fonction du filtre
//         const periodes = await Periode.find(filter)
//             .populate({
//                 path: 'matieres',
//                 select: 'code libelleFr libelleEn'
//             })
//             .populate({
//                 path: 'enseignantsPrincipaux',
//                 select: 'nom prenom'
//             })
//             .populate({
//                 path: 'enseignantsSuppleants',
//                 select: 'nom prenom'
//             })
//             .exec();


//         // Déterminer le jour actuel
//         const now = new Date();
//         const currentDayIndex = now.getDay(); // 0 pour dimanche, 1 pour lundi, ..., 6 pour samedi

//         // Diviser les périodes en groupes par jour de la semaine
//         const periodesParJour = {};
//         for (let i = 0; i < 7; i++) {
//             periodesParJour[i] = [];
//         }
//         periodes.forEach(periode => {
//             const [heure, minutes] = periode.heureDebut.split(':');
//             const heureDebut = new Date();
//             heureDebut.setHours(parseInt(heure));
//             heureDebut.setMinutes(parseInt(minutes));
//             const jourIndex = periode.jour == 1 ? 1 :
//                 periode.jour == 2 ? 2 :
//                 periode.jour == 3 ? 3 :
//                 periode.jour == 4 ? 4 :
//                 periode.jour == 5 ? 5 :
//                 periode.jour == 6 ? 6 :
//                 0; // Dimanche
            
//                  // Vérifier si l'heure de début est déjà passée
//                 if (heureDebut <= now) {
//                     // Si l'heure de début est passée, ajoutez la période à la fin de la liste
//                     periodesParJour[jourIndex].push(periode);
//                 } else {
//                     // Sinon, ajoutez-la au début de la liste
//                     periodesParJour[jourIndex].unshift(periode);
//                 }
            
//         });
//         // Concaténer les groupes de périodes dans l'ordre de la semaine, en commençant par le jour actuel
//         let periodesAVenir = [];
//         let periodesJourCourantDejaPasse = [];
//         periodesParJour[currentDayIndex].forEach(periode => {
//             const [heure, minutes] = periode.heureDebut.split(':');
//             const heureDebut = new Date();
//             heureDebut.setHours(parseInt(heure));
//             heureDebut.setMinutes(parseInt(minutes));
            
//             // Vérifier si l'heure de début est déjà passée
//             if (heureDebut <= now) {
//                 // Si oui, ajouter la période à la liste periodesJourCourantDejaPasse
//                 periodesJourCourantDejaPasse.push(periode);
//             } else {
//                 // Sinon, ajouter la période à la liste periodesAVenir
//                 periodesAVenir.push(periode);
//             }
//         });
        
//         for (let i = currentDayIndex+1; i <= 6; i++) {
//             periodesAVenir = periodesAVenir.concat(periodesParJour[i]);
//         }
//         for (let i = 0; i < currentDayIndex; i++) {
//             periodesAVenir = periodesAVenir.concat(periodesParJour[i]);
//         }
//         periodesAVenir = periodesAVenir.concat(periodesJourCourantDejaPasse);
        

        

//         // Filtrer les périodes null
//         periodesAVenir = periodesAVenir.filter(periode => periode !== null);

//         // Limiter le nombre de périodes à renvoyer
//         const periodesAVenirLimitees = periodesAVenir.slice(0, nbElement);

//         res.status(200).json({
//             success: true,
//             data: { periodes: periodesAVenirLimitees }
//         });
//     } catch (error) {
//         console.error('Erreur lors de la récupération des périodes de cours à venir pour l\'enseignant :', error);
//         res.status(500).json({
//             success: false,
//             message: 'Une erreur est survenue lors de la récupération des périodes de cours à venir.'
//         });
//     }
// }

export const getPeriodesAVenirByEnseignant = async (req, res) => {
    const { enseignantId } = req.params;
    const { nbElement = 5, annee = 2023, semestre = 1 } = req.query;

    try {
        // Filtre pour récupérer les périodes associées à l'enseignant
        const filter = {
            $or: [
                { enseignantsPrincipaux: enseignantId },
                { enseignantsSuppleants: enseignantId }
            ],
            annee: parseInt(annee),
            semestre: parseInt(semestre)
        };

        // Récupérer les périodes de cours en fonction du filtre
        const periodes = await Periode.find(filter)
            .populate({
                path: 'matieres',
                select: 'code libelleFr libelleEn'
            })
            .populate({
                path: 'enseignantsPrincipaux',
                select: 'nom prenom'
            })
            .populate({
                path: 'enseignantsSuppleants',
                select: 'nom prenom'
            })
            .exec();

        // Obtenir l'heure et le jour actuels
        const now = new Date();
        const currentDayIndex = now.getDay(); // 0 pour dimanche, 1 pour lundi, ..., 6 pour samedi

        // Diviser les périodes par jour de la semaine
        const periodesParJour = Array(7).fill([]); // Tableau avec 7 jours

        periodes.forEach(periode => {
            // Conversion de l'heure de début en objet Date pour la comparaison
            const [heureDebutStr, minuteDebutStr] = periode.heureDebut.split(':');
            const heureDebut = new Date();
            heureDebut.setHours(parseInt(heureDebutStr));
            heureDebut.setMinutes(parseInt(minuteDebutStr));

            // Utiliser l'index du jour (0 = dimanche, 1 = lundi, etc.)
            const jourIndex = periode.jour % 7; // Assurer que dimanche = 0 et samedi = 6

            // Ajouter la période au bon jour
            periodesParJour[jourIndex] = [...periodesParJour[jourIndex], periode];
        });

        // Trier les périodes du jour courant
        let periodesAVenir = [];
        const periodesJourCourant = periodesParJour[currentDayIndex];

        const periodesJourCourantDejaPasse = periodesJourCourant.filter(periode => {
            const [heureDebutStr, minuteDebutStr] = periode.heureDebut.split(':');
            const heureDebut = new Date();
            heureDebut.setHours(parseInt(heureDebutStr));
            heureDebut.setMinutes(parseInt(minuteDebutStr));

            return heureDebut <= now;
        });

        const periodesJourCourantAVenir = periodesJourCourant.filter(periode => {
            const [heureDebutStr, minuteDebutStr] = periode.heureDebut.split(':');
            const heureDebut = new Date();
            heureDebut.setHours(parseInt(heureDebutStr));
            heureDebut.setMinutes(parseInt(minuteDebutStr));

            return heureDebut > now;
        });

        // Ajouter d'abord les périodes à venir du jour actuel
        periodesAVenir = [...periodesJourCourantAVenir];

        // Ajouter les périodes des jours suivants
        for (let i = currentDayIndex + 1; i <= 6; i++) {
            periodesAVenir = periodesAVenir.concat(periodesParJour[i]);
        }

        // Ajouter les périodes des jours précédents
        for (let i = 0; i < currentDayIndex; i++) {
            periodesAVenir = periodesAVenir.concat(periodesParJour[i]);
        }

        // Ajouter les périodes déjà passées du jour courant en dernier
        periodesAVenir = periodesAVenir.concat(periodesJourCourantDejaPasse);

        // Limiter le nombre de périodes à renvoyer
        const periodesAVenirLimitees = periodesAVenir.slice(0, nbElement);
        // Renvoyer les périodes à venir
        res.status(200).json({
            success: true,
            data: { periodes: periodesAVenirLimitees }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des périodes de cours à venir pour l\'enseignant :', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de la récupération des périodes de cours à venir.'
        });
    }
};

export const generateEmploisDuTemps = async (req, res) => {
    const {  annee, semestre } = req.params;
    const {section, cycle, niveau, langue, fileType} = req.query;

    // Vérifier si l'ID du niveau est valide
    if (!mongoose.Types.ObjectId.isValid(niveau._id)) {
        return res.status(400).json({ 
            success: false, 
            message: message.identifiant_invalide,
        });
    }

    // Création du filtre initial pour le niveau
    const filter = { niveau: niveau._id };

    // Si une année est spécifiée dans la requête, l'utiliser
    if (annee && !isNaN(annee)) {
        filter.annee = parseInt(annee);
        // const periodesCurrentYear = await Periode.findOne({ niveau: niveau._id, annee }).exec();
        // if (!periodesCurrentYear) {
        //     // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
        //     let found = false;
        //     let previousYear = parseInt(annee) - 1;
        //     while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
        //         const periodesPreviousYear = await Periode.findOne({ niveau: niveau._id, annee: previousYear }).exec();
        //         if (periodesPreviousYear) {
        //             filter.annee = previousYear;
        //             found = true;
        //         } else {
        //             previousYear--;
        //         }
        //     }
        // } 
    }

    // Si un semestre est spécifié dans la requête, l'utiliser
    if (semestre && !isNaN(semestre)) {
        filter.semestre = parseInt(semestre);
    }


    // Rechercher les périodes en fonction du filtre
    const periodes = await Periode.find(filter)
        .populate({
            path: 'matieres',
            select: 'code libelleFr libelleEn'
        })
        .populate({
            path: 'enseignantsPrincipaux',
            select: 'nom prenom'
        })
        .populate({
            path: 'enseignantsSuppleants',
            select: 'nom prenom'
        })
        .exec();
    if(fileType.toLowerCase() === 'pdf'){
        let filePath= './templates/templates_fr/template_emplois_temps_fr.html';
        if(langue==='en'){
            filePath='./templates/templates_en/template_emplois_temps_en.html'
        }
        // Remplir le template avec les données récupérées
        const htmlContent = await fillTemplateEmplois(langue, section, cycle, niveau, periodes, filePath, annee, semestre);

        // Générer le PDF à partir du contenu HTML
        generatePDFAndSendToBrowser(htmlContent, res, 'landscape');
    }else{
        exportToExcel(res, periodes, langue);
    }
}


const exportToExcel = async (res, periodes, langue) => {
    
    if (periodes) {
        let settings = await Setting.find().select('sallesDeCours');
        let setting = null;
        if(settings.length>0){
            setting=settings[0]
        }
        
        // Créer un nouveau classeur Excel
        const workbook = new ExcelJS.Workbook();
        // Ajouter une nouvelle feuille de calcul
        const worksheet = workbook.addWorksheet('Sheet1');

        // Déterminer le libellé de l'entête "Horaire" en fonction de la langue
        const headerTimeLabel = langue === 'fr' ? 'Horaire' : 'Time';

        // Ajouter l'entête (Horaire/Time et les jours de la semaine)
        worksheet.addRow([headerTimeLabel, ...jours.map(jour => langue === 'fr' ? jour.libelleFr : jour.libelleEn)]);

        // Créer un dictionnaire pour organiser les cours par jour et heure
        const coursParJourEtHeure = {};
        periodes.forEach(periode => {
            
            const jourLabel = jours[periode.jour - 1];  // Convertir l'index du jour en libellé
            const heure = `${periode.heureDebut} - ${periode.heureFin}`;
            
            // Créer une clé unique pour chaque horaire
            if (!coursParJourEtHeure[heure]) {
                coursParJourEtHeure[heure] = {};
            }
            
            // Déterminer le libellé du jour en fonction de la langue
            const jourKey = langue === 'fr' ? jourLabel.libelleFr : jourLabel.libelleEn;
            
            // Itération sur les salles de cours et ajout de leurs libellés
            const sallesLibelle = periode.sallesCours && periode.sallesCours.length > 0 
            ? [...new Set(periode.sallesCours.map(salle => setting?.sallesDeCours.find(sc => sc._id.toString() === salle.toString())?.[langue === 'fr' ? 'libelleFr' : 'libelleEn'] || ''))]
                .filter(libelle => libelle) // Filtrer les valeurs vides ou nulles
                .join('/ ')
            : '';
            
            
            // Itération sur les enseignants principaux
            const enseignantsLibelle = periode.enseignantsPrincipaux && periode.enseignantsPrincipaux.length > 0
            ? periode.enseignantsPrincipaux.map((ensPrincipal, index) => {
                const suppléant = periode.enseignantsSuppleants && periode.enseignantsSuppleants[index]; // Suppléant correspondant à l'index
                const principalLibelle = `${premierElement(ensPrincipal.nom)} ${ensPrincipal.prenom ? premierElement(ensPrincipal.prenom) : ""}`;
                const suppléantLibelle = suppléant ? `${premierElement(suppléant.nom)} ${suppléant.prenom ? premierElement(suppléant.prenom) : ""}` : "-";
                return `${principalLibelle}/${suppléantLibelle}`;
            }).join(', ')
            : "-";
            
            
            // Itération sur les matières
            const matieresLibelle = periode.matieres && periode.matieres.length > 0
                ? periode.matieres.map(matiere => langue === 'fr' ? matiere.libelleFr : matiere.libelleEn).join('/ ')
                : "";
            
            // Ajouter le cours à l'horaire correspondant, avec des informations sur des lignes séparées
            if(!periode.pause){
                coursParJourEtHeure[heure][jourKey] = `${matieresLibelle} - (${enseignantsLibelle}) - ${sallesLibelle}`;
            }else{
                const pauseLibelle = periode.pause ? (langue === 'fr' ? 'Pause' : 'Break') : '';
                coursParJourEtHeure[heure][jourKey] = `${pauseLibelle}`;
            }
            
        });

        // Trier les heures par ordre croissant
        const horairesTries = Object.keys(coursParJourEtHeure).sort((a, b) => {
            // Transformer les heures de début en objets Date pour une comparaison facile
            const [startA] = a.split(' - ');
            const [startB] = b.split(' - ');
            return new Date(`1970-01-01T${startA}:00`) - new Date(`1970-01-01T${startB}:00`);
        });

        // Ajouter les périodes de cours au tableau
        horairesTries.forEach(horaire => {
            const coursParJour = coursParJourEtHeure[horaire];
            const row = [horaire]; // Ajouter l'horaire à la première colonne
            jours.forEach(jour => {
                const jourLabel = langue === 'fr' ? jour.libelleFr : jour.libelleEn;
                row.push(coursParJour[jourLabel] || ''); // Ajouter la matière ou une cellule vide si aucun cours
            });
            worksheet.addRow(row);
        });

        // Définir les en-têtes de réponse pour le téléchargement du fichier
        res.setHeader('Content-Disposition', `attachment; filename=emploi_du_temps_ ${langue}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Envoyer le fichier Excel en réponse
        await workbook.xlsx.write(res);
        res.end(); // Terminer la réponse après l'écriture du fichier
    } else {
        res.status(400).json({ success: false, message: message.pas_de_donnees });
    }
};


function getUniqueTimeSlots(periodes) {
    const timeSlots = new Set();
    periodes.forEach(periode => {
        const slot = `${periode.heureDebut}-${periode.heureFin}`;
        timeSlots.add(slot);
    });
    return Array.from(timeSlots).sort();
}

async function fillTemplateEmplois(langue, section, cycle, niveau, periodes, filePath, annee, semestre) {
    try {
        const htmlString = await loadHTML(filePath);
        const $ = cheerio.load(htmlString); // Charger le template HTML avec cheerio
        
        const body = $('body');
        
        body.find('#section').text(langue==='fr'?section.libelleFr:section.libelleEn+" "+cycle.code+""+niveau.code);
        body.find('#semestre').text(semestre);
        body.find('#cycle-niveau').text(cycle.code+""+niveau.code);
        body.find('#annee').text(formatYear(parseInt(annee)));
        const tbody = $('#table-emplois tbody');
        
        const timeSlots = getUniqueTimeSlots(periodes);
        
        timeSlots.forEach(slot => {
            const [startTime, endTime] = slot.split('-');
            const row = $('<tr></tr>');
            row.append(`<td>${startTime} - ${endTime}</td>`);
            
            for (let day = 1; day <= 7; day++) {
                const cell = $(`<td class="time-slot" data-time="${slot}" data-day="${day}"></td>`);
                row.append(cell);
            }
            
            tbody.append(row);
        });
        
        let settings = await Setting.find().select('sallesDeCours typesEnseignement');
        let setting = null;
        if(settings.length>0){
            setting=settings[0]
        }
        
        periodes.forEach(periode => {
            const slot = `${periode.heureDebut}-${periode.heureFin}`;
            const timeSlot = $(`.time-slot[data-time="${slot}"][data-day="${periode.jour}"]`);
            if(!periode.pause){
                if (timeSlot.length > 0) {
                    // Itération sur les salles de cours et ajout de leurs libellés
                    const sallesLibelle = periode.sallesCours && periode.sallesCours.length > 0 
                    ? [...new Set(periode.sallesCours.map(salle => setting?.sallesDeCours.find(sc => sc._id.toString() === salle.toString())?.[langue === 'fr' ? 'libelleFr' : 'libelleEn'] || ''))]
                        .filter(libelle => libelle) // Filtrer les valeurs vides ou nulles
                        .join('/ ')
                    : '';
                    
                    
                    // Itération sur les enseignants principaux
                    const enseignantsLibelle = periode.enseignantsPrincipaux && periode.enseignantsPrincipaux.length > 0
                    ? periode.enseignantsPrincipaux.map((ensPrincipal, index) => {
                        const suppléant = periode.enseignantsSuppleants && periode.enseignantsSuppleants[index]; // Suppléant correspondant à l'index
                        const principalLibelle = `${premierElement(ensPrincipal.nom)} ${ensPrincipal.prenom ? premierElement(ensPrincipal.prenom) : ""}`;
                        const suppléantLibelle = suppléant ? `${premierElement(suppléant.nom)} ${suppléant.prenom ? premierElement(suppléant.prenom) : ""}` : "-";
                        return `${principalLibelle}/${suppléantLibelle}`;
                    }).join(', ')
                    : "-";
                    
                    
                    // Itération sur les matières
                    const matieresLibelle = periode.matieres && periode.matieres.length > 0
                    ? periode.matieres.map(matiere => langue === 'fr' ? matiere.libelleFr : matiere.libelleEn).join('/ ')
                    : "";

                    const content = `${matieresLibelle} <br> ${enseignantsLibelle}  <br> ${sallesLibelle}`;
                    timeSlot.append(`<div>${content}</div>`);
                }
            }else{
                if (timeSlot.length > 0) {
                    
                    timeSlot.append(`<div>${langue==='fr'?'PAUSE':'BREAK'}</div>`);
                }
            }
            
        });

        return $.html(); // Récupérer le HTML mis à jour
    } catch (error) {
        console.error('Erreur lors du remplissage du template :', error);
        return '';
    }
}


// read
export const readPeriode = async (req, res) => { }


export const readPeriodes = async (req, res) => { }



