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
        if (!mongoose.Types.ObjectId.isValid(matiere._id)) {
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

        

        // Trouver le type d'enseignement correspondant à l'identifiant fourni
        const typeEnseignementFind = matiere.typesEnseignement.find(type => type.typeEnseignement.toString() === typeEnseignement.toString());

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
            matiere:matiere._id,
            typeEnseignement,
            heureDebut,
            heureFin,
            salleCours,
            enseignantPrincipal,
            enseignantSuppleant,
        });

        // Enregistrer la période de cours dans la base de données
        const savedPeriodeCours = await newPeriodeCours.save();
        const populatedPeriodeCours = await Periode.populate(savedPeriodeCours, [
            { path: 'matiere', select: '_id code' }, // Peupler avec l'_id et le code de la matière
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
        if (!mongoose.Types.ObjectId.isValid(matiere._id)) {
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
            matiere: matiere._id,
            typeEnseignement,
            heureDebut,
            heureFin,
            salleCours,
            enseignantPrincipal,
            enseignantSuppleant
        }, { new: true });
        const populatedPeriodeCours = await Periode.populate(updatedPeriodeCours, [
            { path: 'matiere', select: '_id code' }, // Peupler avec l'_id et le code de la matière
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
            const periodesCurrentYear = await Periode.findOne({ niveau: niveauId, annee }).exec();
            if (!periodesCurrentYear) {
                // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
                let found = false;
                let previousYear = parseInt(annee) - 1;
                while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
                    const periodesPreviousYear = await Periode.findOne({ niveau: niveauId, annee: previousYear }).exec();
                    if (periodesPreviousYear) {
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
        const periodes = await Periode.find(filter)
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
    const { nbElement = 5, annee = 2024, semestre = 1 } = req.query;
    
    try {
        // Récupérer toutes les périodes de cours pour le niveau spécifié
       // Création du filtre initial pour le niveau
       const filter = { niveau: niveauId };

       // Si une année est spécifiée dans la requête, l'utiliser
       if (annee && !isNaN(annee)) {
           filter.annee = parseInt(annee);
           const periodesCurrentYear = await Periode.findOne({ niveau: niveauId, annee }).exec();
           if (!periodesCurrentYear) {
               // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
               let found = false;
               let previousYear = parseInt(annee) - 1;
               while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
                   const periodesPreviousYear = await Periode.findOne({ niveau: niveauId, annee: previousYear }).exec();
                   if (periodesPreviousYear) {
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
       const periodes = await Periode.find(filter)
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
            const jourIndex = periode.jour === 'Lundi' ? 1 :
                periode.jour === 'Mardi' ? 2 :
                periode.jour === 'Mercredi' ? 3 :
                periode.jour === 'Jeudi' ? 4 :
                periode.jour === 'Vendredi' ? 5 :
                periode.jour === 'Samedi' ? 6 :
                0; // Dimanche
            if (heureDebut > now) {
                periodesParJour[jourIndex].push(periode);
            }
        });
        
        // Concaténer les groupes de périodes dans l'ordre de la semaine, en commençant par le jour actuel
        let periodesAVenir = [];
        for (let i = currentDayIndex; i <= 6; i++) {
            periodesAVenir = periodesAVenir.concat(periodesParJour[i]);
        }
        for (let i = 0; i < currentDayIndex; i++) {
            periodesAVenir = periodesAVenir.concat(periodesParJour[i]);
        }
        
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
    const { nbElement = 5, annee = 2024, semestre = 1 } = req.query;
    
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
            const jourIndex = periode.jour === 'Lundi' ? 1 :
                periode.jour === 'Mardi' ? 2 :
                periode.jour === 'Mercredi' ? 3 :
                periode.jour === 'Jeudi' ? 4 :
                periode.jour === 'Vendredi' ? 5 :
                periode.jour === 'Samedi' ? 6 :
                0; // Dimanche
            if (heureDebut > now) {
                periodesParJour[jourIndex].push(periode);
            }
        });

        // Concaténer les groupes de périodes dans l'ordre de la semaine, en commençant par le jour actuel
        let periodesAVenir = [];
        for (let i = currentDayIndex; i <= 6; i++) {
            periodesAVenir = periodesAVenir.concat(periodesParJour[i]);
        }
        for (let i = 0; i < currentDayIndex; i++) {
            periodesAVenir = periodesAVenir.concat(periodesParJour[i]);
        }

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









// read
export const readPeriode = async (req, res) => { }


export const readPeriodes = async (req, res) => { }



