import Presence from '../../models/presence.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import cheerio from 'cheerio';
import { extractRawText } from 'mammoth';
import ExcelJS from 'exceljs'
import Periode from '../../models/periode.model.js';


export const createPresence = async (req, res) => {
    const { enseignant, matiere,niveau, annee, semestre, jour, heureDebut, heureFin } = req.body;

    try {
        // Vérification des champs obligatoires
        if (!enseignant || !matiere || !niveau || !jour || !heureDebut || !heureFin || !annee || !semestre) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérification de la validité des ObjectIds
        if (!mongoose.Types.ObjectId.isValid(enseignant) || !mongoose.Types.ObjectId.isValid(matiere) || !mongoose.Types.ObjectId.isValid(niveau)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Création d'une nouvelle présence
        const nouvellePresence = new Presence({
            enseignant,
            matiere,
            niveau,
            jour,
            heureDebut,
            heureFin,
            annee,
            semestre
        });

        // Enregistrement de la nouvelle présence dans la base de données
        const savePresence = await nouvellePresence.save();

        res.status(200).json({
            success: true,
            message: message.alert_ajouter_success,
            data: savePresence,
        });
    } catch (error) {
        // console.error('Erreur lors de l\'enregistrement de la présence :', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.',
        });
    }
};


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

        // Étape 1: Obtenir tous les enseignants du niveau pour le semestre et l'année
        const periodes = await Periode.find(periodeFilter)
            .select('enseignantPrincipal enseignantSuppleant')
            .populate('enseignantPrincipal enseignantSuppleant', 'nom prenom');

        // Extraire les enseignants principaux et suppléants
        const enseignantsIds = periodes.reduce((acc, periode) => {
            if (periode.enseignantPrincipal) acc.push(periode.enseignantPrincipal._id);
            if (periode.enseignantSuppleant) acc.push(periode.enseignantSuppleant._id);
            return acc;
        }, []);

        // Supprimer les doublons
        const uniqueEnseignantsIds = [...new Set(enseignantsIds)];

        // Étape 2: Obtenir les présences des enseignants avec totalHoraire
        const presences = await Presence.aggregate([
            { $match: { annee: parseInt(annee), semestre: parseInt(semestre), niveau: niveauId } },
            {
                $group: {
                    _id: "$enseignant",
                    totalHoraire: {
                        $sum: {
                            $subtract: [
                                { $toDate: "$heureFin" },
                                { $toDate: "$heureDebut" }
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'enseignant'
                }
            },
            { $unwind: "$enseignant" },
            {
                $project: {
                    enseignant: {
                        _id: 1,
                        nom: 1, // Modifier selon les champs de l'enseignant
                        prenom: 1,
                    },
                    totalHoraire: {
                        $divide: ["$totalHoraire", 1000 * 60 * 60] // Convertir en heures
                    }
                }
            }
        ]);

        // Étape 3: Combiner les enseignants sans présence avec ceux qui en ont
        const enseignantsPresences = uniqueEnseignantsIds.map(enseignantId => {
            const presence = presences.find(p => p.enseignant._id.equals(enseignantId));
            if (presence) {
                return presence;
            } else {
                // Enseignant sans présence
                const enseignant = periodes.find(p => 
                    (p.enseignantPrincipal && p.enseignantPrincipal._id.equals(enseignantId)) ||
                    (p.enseignantSuppleant && p.enseignantSuppleant._id.equals(enseignantId))
                );
                return {
                    enseignant: enseignant ? enseignant.enseignantPrincipal || enseignant.enseignantSuppleant : null,
                    totalHoraire: 0
                };
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




