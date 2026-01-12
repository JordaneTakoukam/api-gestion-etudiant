import Note from '../../models/note.model.js';
import Anonymat from '../../models/anonymat.model.js';
import Evaluation from '../../models/evaluation.model.js';
import User from '../../models/user.model.js';
import { message } from '../../configs/message.js';
import { appConfigs } from '../../configs/app_configs.js';
import mongoose from 'mongoose';

/**
 * Saisir une note via un numéro d'anonymat
 */
export const saisirNote = async (req, res) => {
    const {
        evaluation,
        matiere,
        anonymat,
        note,
        appreciationFr,
        appreciationEn,
        absent,
        fraude,
        detailsFraude,
        copieBlanche,
        saisiePar,
        modifiePar
    } = req.body;
    console.log("evaluationId ", evaluation)
    console.log("matiereId ", matiere)
    console.log("anonymatId ", anonymat)
    try {
        // Vérifications des champs obligatoires
        if (!evaluation || !matiere || !anonymat) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérifier que la note est fournie si l'étudiant n'est pas absent
        if (!absent && (note === undefined || note === null)) {
            return res.status(400).json({
                success: false,
                message: "La note est obligatoire si l'étudiant n'est pas absent"
            });
        }

        // Vérifier la validité des IDs
        if (!mongoose.Types.ObjectId.isValid(evaluation) || 
            !mongoose.Types.ObjectId.isValid(matiere)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Récupérer l'évaluation
        const eva = await Evaluation.findById(evaluation);
        if (!eva) {
            return res.status(404).json({
                success: false,
                message: "Évaluation non trouvée"
            });
        }

        // Vérifier que l'évaluation n'est pas verrouillée
        if (eva.notesVerrouillees) {
            return res.status(403).json({
                success: false,
                message: "Les notes de cette évaluation sont verrouillées"
            });
        }

        // Vérifier que la matière fait partie de l'évaluation
        const matiereExiste = eva.matieres.some(
            m => m.matiere.toString() === matiere
        );
        if (!matiereExiste) {
            return res.status(400).json({
                success: false,
                message: "Cette matière ne fait pas partie de l'évaluation"
            });
        }

        // Vérifier l'anonymat
        const ano = await Anonymat.findOne({
            numeroAnonymat:anonymat,
            evaluation: evaluation
        });

        if (!ano) {
            return res.status(404).json({
                success: false,
                message: "Numéro d'anonymat invalide ou inexistant pour cette évaluation",
                valide: false
            });
        }

        if (ano.invalide) {
            return res.status(400).json({
                success: false,
                message: "Cet anonymat a été invalidé",
                raison: ano.raisonInvalidation
            });
        }

        // Vérifier que la note est dans les limites
        if (!absent && (note < eva.noteMin || note > eva.noteMax)) {
            return res.status(400).json({
                success: false,
                message: `La note doit être comprise entre ${eva.noteMin} et ${eva.noteMax}`
            });
        }

        // Vérifier si une note existe déjà pour cet anonymat et cette matière
        const noteExistante = await Note.findOne({
            evaluation: evaluation,
            matiere: matiere,
            anonymat: ano._id
        });

        let noteSauvegardee;

        if (noteExistante) {
            // Mise à jour de la note existante
            const ancienneNote = noteExistante.note;
            
            noteExistante.note = absent ? 0 : note;
            noteExistante.appreciationFr = appreciationFr;
            noteExistante.appreciationEn = appreciationEn;
            noteExistante.absent = absent || false;
            noteExistante.fraude = fraude || false;
            noteExistante.detailsFraude = detailsFraude;
            noteExistante.copieBlanche = copieBlanche || false;
            noteExistante.dateModification = new Date();
            noteExistante.modifiePar = modifiePar;

            // Ajouter à l'historique
            noteExistante.historique.push({
                ancienneNote,
                nouvelleNote: absent ? 0 : note,
                modifiePar: modifiePar,
                dateModification: new Date(),
                raison: "Modification par l'enseignant"
            });

            noteSauvegardee = await noteExistante.save();
        } else {
            // Création d'une nouvelle note
            const nouvelleNote = new Note({
                evaluation: evaluation,
                matiere: matiere,
                anonymat: ano._id,
                note: absent ? 0 : note,
                noteMax: evaluation.noteMax,
                appreciationFr,
                appreciationEn,
                saisiePar: saisiePar,
                absent: absent || false,
                fraude: fraude || false,
                detailsFraude,
                copieBlanche: copieBlanche || false,
                statut: 'SAISIE'
            });

            noteSauvegardee = await nouvelleNote.save();

            // Marquer l'anonymat comme utilisé
            ano.utilise = true;
            ano.statut = 'UTILISE';
            await ano.save();
        }

        res.status(201).json({
            success: true,
            message: noteExistante ? "Note mise à jour avec succès" : "Note saisie avec succès",
            data: noteSauvegardee
        });
    } catch (error) {
        console.error('Erreur lors de la saisie de la note:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Obtenir les notes d'une évaluation par matière (pour enseignant)
 */
export const getNotesByEvaluationMatiere = async (req, res) => {
    const { evaluationId, matiereId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId) || 
            !mongoose.Types.ObjectId.isValid(matiereId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const skip = (page - 1) * pageSize;

        // Retourner les notes avec les anonymats, SANS les informations des étudiants
        const notes = await Note.find({
            evaluation: evaluationId,
            matiere: matiereId
        })
            .populate('anonymat', 'numeroAnonymat statut')
            .populate('matiere', 'libelleFr libelleEn')
            .populate('saisiePar', 'nom prenom')
            .sort({ 'anonymat.numeroAnonymat': 1 })
            .skip(skip)
            .limit(parseInt(pageSize));

        const total = await Note.countDocuments({
            evaluation: evaluationId,
            matiere: matiereId
        });

        res.status(200).json({
            success: true,
            data: {
                notes,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / pageSize),
                totalItems: total,
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des notes:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Délibération : rattacher les notes aux étudiants
 */
export const delibererEvaluation = async (req, res) => {
    const { evaluationId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Vérifier que l'utilisateur est admin
        if (!req.user.roles.includes(appConfigs.role.admin) && 
            !req.user.roles.includes(appConfigs.role.superAdmin)) {
            return res.status(403).json({
                success: false,
                message: "Accès refusé. Réservé aux administrateurs."
            });
        }

        const evaluation = await Evaluation.findById(evaluationId);
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: "Évaluation non trouvée"
            });
        }

        // Vérifier que l'évaluation est en phase de délibération
        if (evaluation.statut !== 'DELIBERATION') {
            return res.status(400).json({
                success: false,
                message: "L'évaluation doit être en phase de délibération"
            });
        }

        // Récupérer toutes les notes de cette évaluation
        const notes = await Note.find({ evaluation: evaluationId })
            .populate('anonymat');

        if (notes.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Aucune note à délibérer"
            });
        }

        let notesRattachees = 0;

        // Rattacher chaque note à son étudiant
        for (const note of notes) {
            if (note.anonymat && note.anonymat.etudiant) {
                note.etudiant = note.anonymat.etudiant;
                note.statut = 'VALIDEE';
                note.validee = true;
                note.dateValidation = new Date();
                note.valideePar = req.user._id;
                await note.save();
                notesRattachees++;
            }
        }

        // Mettre à jour l'évaluation
        evaluation.statut = 'PUBLIEE';
        evaluation.dateDeliberation = new Date();
        await evaluation.save();

        res.status(200).json({
            success: true,
            message: "Délibération effectuée avec succès",
            data: {
                notesRattachees,
                totalNotes: notes.length
            }
        });
    } catch (error) {
        console.error('Erreur lors de la délibération:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Publier les résultats (rendre visibles aux étudiants)
 */
export const publierResultats = async (req, res) => {
    const { evaluationId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const evaluation = await Evaluation.findById(evaluationId);
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: "Évaluation non trouvée"
            });
        }

        // Mettre à jour toutes les notes
        await Note.updateMany(
            { evaluation: evaluationId, statut: 'VALIDEE' },
            { 
                statut: 'PUBLIEE',
                publiee: true,
                datePublication: new Date()
            }
        );

        // Mettre à jour l'évaluation
        evaluation.statut = 'PUBLIEE';
        evaluation.datePublication = new Date();
        await evaluation.save();

        res.status(200).json({
            success: true,
            message: "Résultats publiés avec succès"
        });
    } catch (error) {
        console.error('Erreur lors de la publication:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Verrouiller les notes
 */
export const verrouillerNotes = async (req, res) => {
    const { evaluationId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const evaluation = await Evaluation.findById(evaluationId);
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: "Évaluation non trouvée"
            });
        }

        if (evaluation.notesVerrouillees) {
            return res.status(400).json({
                success: false,
                message: "Les notes sont déjà verrouillées"
            });
        }

        // Verrouiller toutes les notes
        await Note.updateMany(
            { evaluation: evaluationId },
            { 
                statut: 'VERROUILLEE',
                verrouillee: true,
                dateVerrouillage: new Date()
            }
        );

        // Verrouiller l'évaluation
        evaluation.notesVerrouillees = true;
        evaluation.dateVerrouillage = new Date();
        evaluation.verrouillePar = req.user._id;
        evaluation.statut = 'VERROUILEE';
        await evaluation.save();

        res.status(200).json({
            success: true,
            message: "Notes verrouillées avec succès"
        });
    } catch (error) {
        console.error('Erreur lors du verrouillage:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Obtenir les notes d'un étudiant pour une évaluation
 */
export const getMesNotes = async (req, res) => {
    const { evaluationId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // L'étudiant ne peut voir que ses propres notes publiées
        const notes = await Note.find({
            evaluation: evaluationId,
            etudiant: req.user._id,
            statut: { $in: ['PUBLIEE', 'VERROUILLEE'] }
        })
            .populate('matiere', 'libelleFr libelleEn')
            .select('-anonymat -saisiePar -historique');

        // Calculer la moyenne
        const moyenne = await Note.calculerMoyenne(evaluationId, req.user._id);

        res.status(200).json({
            success: true,
            data: {
                notes,
                moyenne: moyenne ? moyenne.toFixed(2) : null
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des notes:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Calculer les moyennes de tous les étudiants (ADMIN)
 */
export const calculerMoyennesEvaluation = async (req, res) => {
    const { evaluationId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Récupérer tous les étudiants ayant des notes
        const notesGroupees = await Note.aggregate([
            { 
                $match: { 
                    evaluation: new mongoose.Types.ObjectId(evaluationId),
                    statut: { $in: ['VALIDEE', 'PUBLIEE', 'VERROUILLEE'] }
                } 
            },
            { 
                $group: { 
                    _id: '$etudiant'
                } 
            }
        ]);

        const moyennes = [];

        for (const group of notesGroupees) {
            if (group._id) {
                const etudiant = await User.findById(group._id).select('nom prenom matricule');
                const moyenne = await Note.calculerMoyenne(evaluationId, group._id);
                
                moyennes.push({
                    etudiant,
                    moyenne: moyenne ? parseFloat(moyenne.toFixed(2)) : null
                });
            }
        }

        // Trier par moyenne décroissante
        moyennes.sort((a, b) => (b.moyenne || 0) - (a.moyenne || 0));

        res.status(200).json({
            success: true,
            data: moyennes
        });
    } catch (error) {
        console.error('Erreur lors du calcul des moyennes:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};