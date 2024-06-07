import Periode from '../../models/periode.model.js';
import Matiere from '../../models/matiere.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import moment from 'moment';
import Setting from '../../models/setting.model.js';
import { formatDateFr, formatYear, generatePDFAndSendToBrowser, loadHTML } from '../../fonctions/fonctions.js';
import cheerio from 'cheerio';

// Définir la locale française pour moment
moment.locale('fr');

// create
export const createPeriode = async (req, res) => {
    const {
        jour,
        semestre,
        annee,
        niveau,
        matiere,
        typeEnseignement,
        enseignantPrincipal, 
        enseignantSuppleant,
        heureDebut,
        heureFin,
        salleCours,
        pause
    } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont renseignés
        if(pause){
            if (!jour || !semestre || !annee || !niveau || !heureDebut || !heureFin) {
                return res.status(400).json({ 
                    success: false, 
                    message: message.champ_obligatoire,
                });
            }
        }else{
            if (!jour || !semestre || !annee || !niveau || !matiere || !typeEnseignement || !enseignantPrincipal || !heureDebut || !heureFin || !salleCours) {
                return res.status(400).json({ 
                    success: false, 
                    message: message.champ_obligatoire,
                });
            }
        }
        
        

        // Vérifier si les ObjectID pour les références existent et sont valides
        if (!mongoose.Types.ObjectId.isValid(niveau)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!pause && !mongoose.Types.ObjectId.isValid(matiere._id)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!pause && !mongoose.Types.ObjectId.isValid(enseignantPrincipal._id)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!pause && enseignantSuppleant && !mongoose.Types.ObjectId.isValid(enseignantSuppleant._id)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!pause && !mongoose.Types.ObjectId.isValid(typeEnseignement)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!pause && !mongoose.Types.ObjectId.isValid(salleCours)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si les heures de début et de fin sont valides
        const heureRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/; // Expression régulière pour valider le format HH:MM
        if (!heureRegex.test(heureDebut) || !heureRegex.test(heureFin)) {
            return res.status(400).json({ 
                success: false, 
                message: message.heure_invalide, 
            });
        }

        // Vérifier si une période de cours existe déjà avec les mêmes paramètres
        const existingPeriodeCours = await Periode.findOne({
            jour,
            semestre,
            annee,
            niveau,
            $or: [
                { heureDebut: { $lt: heureFin }, heureFin: { $gt: heureDebut } }, // Vérification d'heures qui se chevauchent
                { heureDebut: { $gte: heureDebut, $lte: heureFin } },
                { heureFin: { $gte: heureDebut, $lte: heureFin } }
            ]
        });
        if (existingPeriodeCours) {
            return res.status(400).json({ 
                success: false, 
                message: message.existe_periode_cours
            });
        }

        

        // Trouver le type d'enseignement correspondant à l'identifiant 
        
        // let typeEnseignementFind = undefined;
        // if(matiere && typeEnseignement){
        //     typeEnseignementFind = matiere.typesEnseignement.find(type => type.typeEnseignement.toString() === typeEnseignement.toString());
        // }
        

        // if (!pause && !typeEnseignementFind) {
        //     return res.status(404).json({ 
        //         success: false, 
        //         message: message.type_ens_non_trouve
        //     });
        // }
        // let enseignantPrincipal = undefined;
        // let enseignantSuppleant = undefined;
        // if(typeEnseignementFind){
            // Extraire l'enseignant principal et l'enseignant suppléant
            // enseignantPrincipal = typeEnseignementFind.enseignantPrincipal;
            // enseignantSuppleant = typeEnseignementFind.enseignantSuppleant;
            // Vérifier si un enseignant principal a déjà un cours programmé au même moment
            const existingEnseignantPrincipalCours = await Periode.findOne({
                jour,
                annee,
                semestre,
                $or: [
                    { 
                        heureDebut: { $lt: heureFin }, 
                        heureFin: { $gt: heureDebut },
                        $or: [
                            { 'enseignantPrincipal': enseignantPrincipal },
                            { 'enseignantSuppleant': enseignantPrincipal }
                        ]
                    },
                    { 
                        $and: [
                            { heureDebut: { $gte: heureDebut, $lte: heureFin } },
                            { $or: [
                                { 'enseignantPrincipal': enseignantPrincipal },
                                { 'enseignantSuppleant': enseignantPrincipal }
                            ]}
                        ]
                    },
                    { 
                        $and: [
                            { heureFin: { $gte: heureDebut, $lte: heureFin } },
                            { $or: [
                                { 'enseignantPrincipal': enseignantPrincipal },
                                { 'enseignantSuppleant': enseignantPrincipal }
                            ]}
                        ]
                    }
                ]
            });
            if(existingEnseignantPrincipalCours){
                return res.status(400).json({ 
                    success: false, 
                    message: message.existe_enseignant_p_cours,
                });
            }

            // Vérifier si un enseignant suppleant a déjà un cours programmé au même moment
            const existingEnseignantSuppleantCours = await Periode.findOne({
                jour,
                annee,
                semestre,
                $or: [
                    { 
                        heureDebut: { $lt: heureFin }, 
                        heureFin: { $gt: heureDebut },
                        $or: [
                            { 'enseignantPrincipal': enseignantSuppleant },
                            { 'enseignantSuppleant': enseignantSuppleant }
                        ]
                    },
                    { 
                        $and: [
                            { heureDebut: { $gte: heureDebut, $lte: heureFin } },
                            { $or: [
                                { 'enseignantPrincipal': enseignantSuppleant },
                                { 'enseignantSuppleant': enseignantSuppleant }
                            ]}
                        ]
                    },
                    { 
                        $and: [
                            { heureFin: { $gte: heureDebut, $lte: heureFin } },
                            { $or: [
                                { 'enseignantPrincipal': enseignantSuppleant },
                                { 'enseignantSuppleant': enseignantSuppleant }
                            ]}
                        ]
                    }
                ]
            });
            if(existingEnseignantSuppleantCours){
                return res.status(400).json({ 
                    success: false, 
                    message: message.existe_enseignant_s_cours,
                });
            }

        // }
        
        if(salleCours){
            // Vérifier si une salle de cours a déjà un cours programmé au même moment
            const existingSalleCoursCours = await Periode.findOne({
                jour,
                annee,
                semestre,
                $or: [
                    { 
                        heureDebut: { $lt: heureFin }, 
                        heureFin: { $gt: heureDebut },
                        salleCours: salleCours
                    },
                    { 
                        $and: [
                            { heureDebut: { $gte: heureDebut, $lte: heureFin } },
                            { salleCours: salleCours }
                        ]
                    },
                    { 
                        $and: [
                            { heureFin: { $gte: heureDebut, $lte: heureFin } },
                            { salleCours: salleCours }
                        ]
                    }
                ]
            });
            if (existingSalleCoursCours) {
                return res.status(400).json({ 
                    success: false, 
                    message: message.existe_salle_cours_programme,
                });
            }

        }
        
        // Créer une nouvelle période de cours
        let matiereId=undefined;
        if(matiere){
            matiereId=matiere._id
        }

        let enseignantPrincipalId=undefined;
        if(enseignantPrincipal){
            enseignantPrincipalId=enseignantPrincipal._id;
        }

        let enseignantSuppleantId=undefined;
        if(enseignantSuppleant){
            enseignantSuppleantId=enseignantSuppleant._id;
        }

        const newPeriodeCours = new Periode({
            jour,
            semestre,
            annee,
            pause,
            niveau,
            matiere:matiereId,
            typeEnseignement,
            heureDebut,
            heureFin,
            salleCours,
            enseignantPrincipal:enseignantPrincipalId,
            enseignantSuppleant:enseignantSuppleantId
        });

        // Enregistrer la période de cours dans la base de données
        const savedPeriodeCours = await newPeriodeCours.save();
        const populatedPeriodeCours = await Periode.populate(savedPeriodeCours, [
            { path: 'matiere', select: '_id code libelleFr libelleEn typesEnseignement' }, // Peupler avec l'_id et le code de la matière
            { path: 'enseignantPrincipal', select: '_id nom prenom' }, // Peupler avec l'_id, le nom et le prénom de l'enseignant principal
            { path: 'enseignantSuppleant', select: '_id nom prenom' } // Peupler avec l'_id, le nom et le prénom de l'enseignant suppléant
        ]);

        res.status(201).json({ 
            success: true,
            message: message.ajouter_avec_success,
            data: populatedPeriodeCours 
        });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la période de cours :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
}



// update
export const updatePeriode = async (req, res) => {
    const {periodeId} = req.params;
    const {
        jour,
        semestre,
        annee,
        niveau,
        matiere,
        typeEnseignement,
        enseignantPrincipal, 
        enseignantSuppleant,
        heureDebut,
        heureFin,
        salleCours,
        pause,
    } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont renseignés
        if(pause){
            if (!jour || !semestre || !annee || !niveau || !heureDebut || !heureFin) {
                return res.status(400).json({ 
                    success: false, 
                    message: message.champ_obligatoire,
                });
            }
        }else{
            if (!jour || !semestre || !annee || !niveau || !matiere || !enseignantPrincipal || !typeEnseignement || !heureDebut || !heureFin || !salleCours) {
                return res.status(400).json({ 
                    success: false, 
                    message: message.champ_obligatoire,
                });
            }
        }

        // Vérifier si les ObjectID pour les références existent et sont valides
        if (!mongoose.Types.ObjectId.isValid(niveau)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!pause && !mongoose.Types.ObjectId.isValid(matiere._id)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!pause && !mongoose.Types.ObjectId.isValid(typeEnseignement)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!pause && !mongoose.Types.ObjectId.isValid(enseignantPrincipal._id)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!pause && enseignantSuppleant && !mongoose.Types.ObjectId.isValid(enseignantSuppleant._id)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!pause && !mongoose.Types.ObjectId.isValid(salleCours)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si les heures de début et de fin sont valides
        const heureRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/; // Expression régulière pour valider le format HH:MM
        if (!heureRegex.test(heureDebut) || !heureRegex.test(heureFin)) {
            return res.status(400).json({ 
                success: false, 
                message: message.heure_invalide, 
            });
        }

        // Vérifier si une période de cours existe déjà avec les mêmes paramètres, à l'exception de la période en cours de modification
        const existingPeriodeCours = await Periode.findOne({
            _id: { $ne: periodeId },
            jour,
            semestre,
            annee,
            niveau,
            $or: [
                { heureDebut: { $lt: heureFin }, heureFin: { $gt: heureDebut } }, // Vérification d'heures qui se chevauchent
                { heureDebut: { $gte: heureDebut, $lte: heureFin } },
                { heureFin: { $gte: heureDebut, $lte: heureFin } }
            ]
        });
        if (existingPeriodeCours) {
            return res.status(400).json({ 
                success: false, 
                message: message.existe_periode_cours
            });
        }
        // // Récupérer la matière correspondante
        // let matiereFind = undefined;
        // if(matiere){
        //     matiereFind = await Matiere.findById(matiere);
        // }

        // if (!pause && !matiereFind) {
        //     return res.status(404).json({ 
        //         success: false, 
        //         message: message.matiere_non_trouvee,
        //     });
        // }
        
        // if(matiereFind){
            // Trouver le type d'enseignement correspondant à l'identifiant fourni
            // let typeEnseignementFind = undefined;
            // if(typeEnseignement){
            //     typeEnseignementFind = matiereFind.typesEnseignement.find(type => type.typeEnseignement.toString() === typeEnseignement.toString());
            // }

            // if (!typeEnseignementFind) {
            //     return res.status(404).json({ 
            //         success: false, 
            //         message: message.type_ens_non_trouve
            //     });
            // }
            // Extraire l'enseignant principal et l'enseignant suppléant
            // enseignantPrincipal = typeEnseignementFind.enseignantPrincipal;
            // enseignantSuppleant = typeEnseignementFind.enseignantSuppleant;
            // Vérifier si un enseignant principal a déjà un cours programmé au même moment
            const existingEnseignantPrincipalCours = await Periode.findOne({
                _id: { $ne: periodeId },
                jour,
                annee,
                semestre,
                $or: [
                    { 
                        heureDebut: { $lt: heureFin }, 
                        heureFin: { $gt: heureDebut },
                        $or: [
                            { 'enseignantPrincipal': enseignantPrincipal },
                            { 'enseignantSuppleant': enseignantPrincipal }
                        ]
                    },
                    { 
                        $and: [
                            { heureDebut: { $gte: heureDebut, $lte: heureFin } },
                            { $or: [
                                { 'enseignantPrincipal': enseignantPrincipal },
                                { 'enseignantSuppleant': enseignantPrincipal }
                            ]}
                        ]
                    },
                    { 
                        $and: [
                            { heureFin: { $gte: heureDebut, $lte: heureFin } },
                            { $or: [
                                { 'enseignantPrincipal': enseignantPrincipal },
                                { 'enseignantSuppleant': enseignantPrincipal }
                            ]}
                        ]
                    }
                ]
            });
            if(existingEnseignantPrincipalCours){
                return res.status(400).json({ 
                    success: false, 
                    message: message.existe_enseignant_p_cours,
                });
            }

            // Vérifier si un enseignant suppleant a déjà un cours programmé au même moment
            const existingEnseignantSuppleantCours = await Periode.findOne({
                _id: { $ne: periodeId },
                jour,
                annee,
                semestre,
                $or: [
                    { 
                        heureDebut: { $lt: heureFin }, 
                        heureFin: { $gt: heureDebut },
                        $or: [
                            { 'enseignantPrincipal': enseignantSuppleant },
                            { 'enseignantSuppleant': enseignantSuppleant }
                        ]
                    },
                    { 
                        $and: [
                            { heureDebut: { $gte: heureDebut, $lte: heureFin } },
                            { $or: [
                                { 'enseignantPrincipal': enseignantSuppleant },
                                { 'enseignantSuppleant': enseignantSuppleant }
                            ]}
                        ]
                    },
                    { 
                        $and: [
                            { heureFin: { $gte: heureDebut, $lte: heureFin } },
                            { $or: [
                                { 'enseignantPrincipal': enseignantSuppleant },
                                { 'enseignantSuppleant': enseignantSuppleant }
                            ]}
                        ]
                    }
                ]
            });
            if(existingEnseignantSuppleantCours){
                return res.status(400).json({ 
                    success: false, 
                    message: message.existe_enseignant_s_cours,
                });
            }
        // }
        if(salleCours){
            // Vérifier si une salle de cours a déjà un cours programmé au même moment
            const existingSalleCoursCours = await Periode.findOne({
                _id: { $ne: periodeId },
                jour,
                annee,
                semestre,
                $or: [
                    { 
                        heureDebut: { $lt: heureFin }, 
                        heureFin: { $gt: heureDebut },
                        salleCours: salleCours
                    },
                    { 
                        $and: [
                            { heureDebut: { $gte: heureDebut, $lte: heureFin } },
                            { salleCours: salleCours }
                        ]
                    },
                    { 
                        $and: [
                            { heureFin: { $gte: heureDebut, $lte: heureFin } },
                            { salleCours: salleCours }
                        ]
                    }
                ]
            });
            if (existingSalleCoursCours) {
                return res.status(400).json({ 
                    success: false, 
                    message: message.existe_salle_cours_programme,
                });
            }

        }
        

        // Mettre à jour la période de cours
        let matiereId=undefined;
        if(matiere){
            matiereId=matiere._id;
        }

        let enseignantPrincipalId=undefined;
        if(enseignantPrincipal){
            enseignantPrincipalId=enseignantPrincipal._id;
        }

        let enseignantSuppleantId=undefined;
        if(enseignantSuppleant){
            enseignantSuppleantId=enseignantSuppleant._id;
        }

        const updatedPeriodeCours = await Periode.findByIdAndUpdate(periodeId, {
            jour,
            semestre,
            annee,
            pause,
            niveau,
            matiere: matiereId,
            typeEnseignement,
            heureDebut,
            heureFin,
            salleCours,
            enseignantPrincipal:enseignantPrincipalId,
            enseignantSuppleant:enseignantSuppleantId
        }, { new: true });
        const populatedPeriodeCours = await Periode.populate(updatedPeriodeCours, [
            { path: 'matiere', select: '_id code libelleFr libelleEn' }, // Peupler avec l'_id et le code de la matière
            { path: 'enseignantPrincipal', select: '_id nom prenom' }, // Peupler avec l'_id, le nom et le prénom de l'enseignant principal
            { path: 'enseignantSuppleant', select: '_id nom prenom' } // Peupler avec l'_id, le nom et le prénom de l'enseignant suppléant
        ]);

        res.status(200).json({ 
            success: true,
            message: message.mis_a_jour,
            data: populatedPeriodeCours 
        });
    } catch (error) {
        console.error('Erreur lors de la modification de la période de cours :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};

// delete
export const deletePeriode = async (req, res) => {
    const {periodeId} = req.params; // Supposons que l'identifiant de la période soit passé en tant que paramètre d'URL

    try {
        // Vérifier si la période existe
        const existingPeriode = await Periode.findById(periodeId);
        if (!existingPeriode) {
            return res.status(404).json({ 
                success: false, 
                message: message.periode_non_trouve, 
            });
        }

        // Supprimer la période de cours de la base de données
        await Periode.findByIdAndDelete(periodeId);

        res.status(200).json({ 
            success: true, 
            message: message.supprimer_avec_success
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de la période de cours :', error);
        res.status(500).json({ 
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
                path: 'matiere',
                select: '_id code libelleFr libelleEn typesEnseignement'
            })
            .populate({
                path: 'enseignantPrincipal',
                select: '_id nom prenom'
            })
            .populate({
                path: 'enseignantSuppleant',
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
               path: 'matiere',
               select: 'code libelleFr libelleEn'
           })
           .populate({
               path: 'enseignantPrincipal',
               select: 'nom prenom'
           })
           .populate({
               path: 'enseignantSuppleant',
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

export const getPeriodesAVenirByEnseignant = async (req, res) => {
    const { enseignantId } = req.params;
    const { nbElement = 5, annee = 2023, semestre = 1 } = req.query;

    try {
        // Récupérer toutes les périodes de cours pour l'enseignant spécifié
        const filter = {
            $or: [
                { enseignantPrincipal: enseignantId },
                { enseignantSuppleant: enseignantId }
            ]
        };

        // Si une année est spécifiée dans la requête, l'utiliser
        if (annee && !isNaN(annee)) {
            filter.annee = parseInt(annee);
        }

        // Si un semestre est spécifié dans la requête, l'utiliser
        if (semestre && !isNaN(semestre)) {
            filter.semestre = parseInt(semestre);
        }

        // Rechercher les périodes en fonction du filtre
        const periodes = await Periode.find(filter)
            .populate({
                path: 'matiere',
                select: 'code libelleFr libelleEn'
            })
            .populate({
                path: 'enseignantPrincipal',
                select: 'nom prenom'
            })
            .populate({
                path: 'enseignantSuppleant',
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
        console.error('Erreur lors de la récupération des périodes de cours à venir pour l\'enseignant :', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de la récupération des périodes de cours à venir.'
        });
    }
}


export const generateEmploisDuTemps = async (req, res) => {
    const {  annee, semestre } = req.params;
    const {section, cycle, niveau, langue} = req.query;

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
            path: 'matiere',
            select: 'code libelleFr libelleEn'
        })
        .populate({
            path: 'enseignantPrincipal',
            select: 'nom prenom'
        })
        .populate({
            path: 'enseignantSuppleant',
            select: 'nom prenom'
        })
        .exec();
    let filePath= './templates/templates_fr/template_emplois_temps_fr.html';
    if(langue==='en'){
        filePath='./templates/templates_en/template_emplois_temps_en.html'
    }
    // Remplir le template avec les données récupérées
    const htmlContent = await fillTemplateEmplois(langue, section, cycle, niveau, periodes, filePath, annee, semestre);

    // Générer le PDF à partir du contenu HTML
    generatePDFAndSendToBrowser(htmlContent, res, 'landscape');
}



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
        
        let settings = await Setting.find().select('salleDeCours typesEnseignement');
        let setting = null;
        if(settings.length>0){
            setting=settings[0]
        }
        periodes.forEach(periode => {
            const slot = `${periode.heureDebut}-${periode.heureFin}`;
            const timeSlot = $(`.time-slot[data-time="${slot}"][data-day="${periode.jour}"]`);
            if(!periode.pause){
                const typeEns = setting.typesEnseignement.find(type=>type._id.toString()===periode.typeEnseignement.toString()).code;
                const salle = setting.salleDeCours.find(salle=>salle._id.toString()===periode.salleCours.toString()).code;
                if (timeSlot.length > 0) {
                    // const content = `${langue==='fr'?periode.matiere.libelleFr:periode.matiere.libelleEn} (${typeEns?typeEns:""}) - ${periode.enseignantPrincipal.nom} ${periode.enseignantPrincipal.prenom}/${periode.enseignantSuppleant.nom} ${periode.enseignantSuppleant.prenom} - ${salle?salle:""}`;
                    const content = `${langue==='fr'?periode.matiere.libelleFr:periode.matiere.libelleEn} <br> ${periode.enseignantPrincipal.nom} ${periode.enseignantPrincipal.prenom}/${periode.enseignantSuppleant.nom} ${periode.enseignantSuppleant.prenom} <br> ${salle?salle:""}`;
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



