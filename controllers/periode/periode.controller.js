import Periode from '../../models/periode.model.js';
import Matiere from '../../models/matiere.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import moment from 'moment';

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
        heureDebut,
        heureFin,
        salleCours
    } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont renseignés
        if (!jour || !semestre || !annee || !niveau || !matiere || !typeEnseignement || !heureDebut || !heureFin || !salleCours) {
            return res.status(400).json({ 
                success: false, 
                message: message.champ_obligatoire,
            });
        }

        // Vérifier si les ObjectID pour les références existent et sont valides
        if (!mongoose.Types.ObjectId.isValid(niveau)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!mongoose.Types.ObjectId.isValid(matiere)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!mongoose.Types.ObjectId.isValid(typeEnseignement)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!mongoose.Types.ObjectId.isValid(salleCours)) {
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

        // Récupérer la matière correspondante
        const matiereFind = await Matiere.findById(matiere);

        if (!matiereFind) {
            return res.status(404).json({ 
                success: false, 
                message: message.matiere_non_trouvee,
            });
        }

        // Trouver le type d'enseignement correspondant à l'identifiant fourni
        const typeEnseignementFind = matiereFind.typesEnseignement.find(type => type.typeEnseignement.toString() === typeEnseignement.toString());

        if (!typeEnseignementFind) {
            return res.status(404).json({ 
                success: false, 
                message: message.type_ens_non_trouve
            });
        }
        // Extraire l'enseignant principal et l'enseignant suppléant
        const enseignantPrincipal = typeEnseignementFind.enseignantPrincipal;
        const enseignantSuppleant = typeEnseignementFind.enseignantSuppleant;
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

        // Créer une nouvelle période de cours
        const newPeriodeCours = new Periode({
            jour,
            semestre,
            annee,
            niveau,
            matiere,
            typeEnseignement,
            heureDebut,
            heureFin,
            salleCours,
            enseignantPrincipal,
            enseignantSuppleant,
        });

        // Enregistrer la période de cours dans la base de données
        const savedPeriodeCours = await newPeriodeCours.save();

        res.status(201).json({ 
            success: true,
            message: message.ajouter_avec_success,
            data: savedPeriodeCours 
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
        heureDebut,
        heureFin,
        salleCours
    } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont renseignés
        if (!jour || !semestre || !annee || !niveau || !matiere || !typeEnseignement || !heureDebut || !heureFin || !salleCours) {
            return res.status(400).json({ 
                success: false, 
                message: message.champ_obligatoire,
            });
        }

        // Vérifier si les ObjectID pour les références existent et sont valides
        if (!mongoose.Types.ObjectId.isValid(niveau)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!mongoose.Types.ObjectId.isValid(matiere)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!mongoose.Types.ObjectId.isValid(typeEnseignement)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }
        if (!mongoose.Types.ObjectId.isValid(salleCours)) {
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
        // Récupérer la matière correspondante
        const matiereFind = await Matiere.findById(matiere);

        if (!matiereFind) {
            return res.status(404).json({ 
                success: false, 
                message: message.matiere_non_trouvee,
            });
        }

        // Trouver le type d'enseignement correspondant à l'identifiant fourni
        const typeEnseignementFind = matiereFind.typesEnseignement.find(type => type.typeEnseignement.toString() === typeEnseignement.toString());

        if (!typeEnseignementFind) {
            return res.status(404).json({ 
                success: false, 
                message: message.type_ens_non_trouve
            });
        }
        // Extraire l'enseignant principal et l'enseignant suppléant
        const enseignantPrincipal = typeEnseignementFind.enseignantPrincipal;
        const enseignantSuppleant = typeEnseignementFind.enseignantSuppleant;
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


        // Mettre à jour la période de cours
        const updatedPeriodeCours = await Periode.findByIdAndUpdate(periodeId, {
            jour,
            semestre,
            annee,
            niveau,
            matiere,
            typeEnseignement,
            heureDebut,
            heureFin,
            salleCours
        }, { new: true });

        res.status(200).json({ 
            success: true,
            message: message.mis_a_jour,
            data: updatedPeriodeCours 
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
    const {niveauId}=req.params;
    const {page = 1, pageSize = 10 } = req.query;

    try {
        // Vérifier si l'ID du niveau est valide
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }

        // Convertir les paramètres de pagination en nombres entiers
        const pageNumber = parseInt(page);
        const pageSizeNumber = parseInt(pageSize);

        // Calculer l'indice de départ pour la pagination
        const startIndex = (pageNumber - 1) * pageSizeNumber;

        // Récupérer la liste des périodes du niveau spécifié, paginée
        const periodes = await Periode.find({ niveau: niveauId })
            .skip(startIndex)
            .limit(pageSizeNumber)
            .populate({
                path: 'matiere',
                select: 'code'
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

        // Compter le nombre total de périodes pour ce niveau
        const totalCount = await Periode.countDocuments({ niveau: niveauId });

        res.status(200).json({ 
            success: true,
            data: {
                periodes,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCount / pageSizeNumber),
                totalItems: totalCount
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des périodes par niveau :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
}

export const getPeriodesAVenirByNiveau = async (req, res) => {
    const {niveauId}=req.params;
    const {nbElement = 5 } = req.query;
    try {
        // Déterminer le jour et l'heure actuels
        const now = moment();
        // Rechercher les 5 périodes de cours à venir pour le niveau spécifié
        const periodesAVenir = await Periode.find({
            jour: now.format('dddd'), // Format 'dddd' pour obtenir le nom complet du jour de la semaine
            heureDebut: { $gte: now.format('HH:mm') }, // Heure de début supérieure ou égale à l'heure actuelle
            niveau: niveauId // Filtrer par le niveau spécifié
        })
        .sort({ heureDebut: 1 }) // Trier par heure de début croissante
        .limit(nbElement)
        .populate({
            path: 'matiere',
            select: 'code'
        })
        .populate({
            path: 'enseignantPrincipal',
            select: 'nom prenom'
        })
        .populate({
            path: 'enseignantSuppleant',
            select: 'nom prenom'
        })
        .exec(); // Limiter à 5 résultats

        res.status(200).json({ 
            success: true,
            data: periodesAVenir
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des périodes de cours à venir pour le niveau :', error);
        res.status(500).json({ 
            success: false,
            message:message.erreurServeur
        });
    }
    
}



// read
export const readPeriode = async (req, res) => { }


export const readPeriodes = async (req, res) => { }



