

import Discipline from '../../models/discipline.model.js';
import Evaluation from '../../models/evaluation.model.js';
import CoefficientDiscipline from '../../models/coefficient_discipline.model.js';
import User from '../../models/user.model.js';
import { message } from '../../configs/message.js';
import { appConfigs } from '../../configs/app_configs.js';
import mongoose from 'mongoose';

/**
 * Obtenir la liste des étudiants d'une évaluation pour la saisie de discipline
 */
export const getEtudiantsForDiscipline = async (req, res) => {
    const { evaluationId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Récupérer l'évaluation
        const evaluation = await Evaluation.findById(evaluationId);
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: message.evaluation_non_trouvee
            });
        }

        // Récupérer tous les étudiants du niveau concerné pour l'année donnée
        const etudiants = await User.find({
            roles: { $in: [appConfigs.role.etudiant] },
            'niveaux.niveau': evaluation.niveau,
            'niveaux.annee': evaluation.annee
        })
        .select('nom prenom matricule email')
        .sort({ matricule: 1 });

        if (etudiants.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.etudiant_non_trouvee
            });
        }

        // Récupérer les notes de discipline déjà saisies
        const notesExistantes = await Discipline.find({
            evaluation: evaluationId
        }).select('etudiant');

        const etudiantsAvecNote = new Set(
            notesExistantes.map(n => n.etudiant.toString())
        );

        // Marquer les étudiants qui ont déjà une note
        const etudiantsAvecStatut = etudiants.map(etudiant => ({
            _id: etudiant._id,
            nom: etudiant.nom,
            prenom: etudiant.prenom,
            matricule: etudiant.matricule,
            email: etudiant.email,
            aNoteDisc: etudiantsAvecNote.has(etudiant._id.toString())
        }));

        res.status(200).json({
            success: true,
            data: {
                etudiants: etudiantsAvecStatut,
                total: etudiantsAvecStatut.length,
                avecNote: etudiantsAvecNote.size,
                sansNote: etudiantsAvecStatut.length - etudiantsAvecNote.size
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des étudiants:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Saisir une note de discipline directement pour un étudiant
 */
export const saisirNoteDiscipline = async (req, res) => {
    const {
        evaluation,
        etudiant,
        note,
        appreciationFr,
        appreciationEn,
        manquements,
        bonus,
        saisiePar,
        modifiePar
    } = req.body;
    
    try {
        // Vérifications des champs obligatoires
        if (!evaluation || !etudiant) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérifier que la note est fournie
        if (note === undefined || note === null) {
            return res.status(400).json({
                success: false,
                message: message.note_obligatoire_absent
            });
        }

        // Vérifier la validité des IDs
        if (!mongoose.Types.ObjectId.isValid(evaluation) || 
            !mongoose.Types.ObjectId.isValid(etudiant)) {
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
                message: message.evaluation_non_trouvee
            });
        }

        // Vérifier que l'évaluation n'est pas verrouillée
        if (eva.notesVerrouillees) {
            return res.status(403).json({
                success: false,
                message: message.notes_evaluation_verrouillees
            });
        }

        // Vérifier que l'étudiant existe
        const etud = await User.findById(etudiant);
        if (!etud) {
            return res.status(404).json({
                success: false,
                message: message.etudiant_non_trouvee
            });
        }

        // Vérifier que la note est dans les limites
        if (note < eva.noteMin || note > eva.noteMax) {
            return res.status(400).json({
                success: false,
                message: `${message.note_comprise} ${eva.noteMin} - ${eva.noteMax}`
            });
        }

        // Vérifier si une note de discipline existe déjà pour cet étudiant
        const noteExistante = await Discipline.findOne({
            evaluation: evaluation,
            etudiant: etudiant
        });

        let noteSauvegardee;

        if (noteExistante) {
            // Mise à jour de la note existante
            const ancienneNote = noteExistante.note;
            
            noteExistante.note = note;
            noteExistante.appreciationFr = appreciationFr;
            noteExistante.appreciationEn = appreciationEn;
            noteExistante.manquements = manquements || [];
            noteExistante.bonus = bonus || [];
            noteExistante.dateModification = new Date();
            noteExistante.modifiePar = modifiePar;

            // Ajouter à l'historique
            noteExistante.historique.push({
                ancienneNote,
                nouvelleNote: note,
                modifiePar: modifiePar,
                dateModification: new Date(),
                raison: "Modification par le responsable"
            });

            noteSauvegardee = await noteExistante.save();
        } else {
            // Création d'une nouvelle note de discipline
            const nouvelleNote = new Discipline({
                evaluation: evaluation,
                etudiant: etudiant,
                note: note,
                noteMax: eva.noteMax,
                appreciationFr,
                appreciationEn,
                manquements: manquements || [],
                bonus: bonus || [],
                saisiePar: saisiePar,
                statut: 'VALIDEE'
            });

            noteSauvegardee = await nouvelleNote.save();
        }

        // Peupler les données pour la réponse
        await noteSauvegardee.populate('etudiant', 'nom prenom matricule');

        res.status(201).json({
            success: true,
            message: noteExistante ? message.mis_a_jour : message.ajouter_avec_success,
            data: noteSauvegardee
        });
    } catch (error) {
        console.error('Erreur lors de la saisie de la note de discipline:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Obtenir les notes de discipline d'une évaluation
 */
export const getNotesDisciplineByEvaluation = async (req, res) => {
    const { evaluationId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const skip = (page - 1) * pageSize;

        const notes = await Discipline.find({
            evaluation: evaluationId
        })
            .populate('etudiant', 'nom prenom matricule email')
            .populate('saisiePar', 'nom prenom')
            .sort({ 'etudiant.matricule': 1 })
            .skip(skip)
            .limit(parseInt(pageSize));

        const total = await Discipline.countDocuments({
            evaluation: evaluationId
        });

        res.status(200).json({
            success: true,
            data: {
                disciplines:notes,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / pageSize),
                totalItems: total,
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des notes de discipline:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Délibération : valider les notes de discipline
 * (Simplifié car les notes sont déjà liées aux étudiants)
 */
export const delibererDiscipline = async (req, res) => {
    const { evaluationId } = req.params;
    const { valideePar } = req.query;

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
                message: message.evaluation_non_trouvee
            });
        }

        // Récupérer toutes les notes de discipline de cette évaluation
        const notes = await Discipline.find({ evaluation: evaluationId });

        if (notes.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Aucune note de discipline à délibérer"
            });
        }

        let notesValidees = 0;

        // Valider toutes les notes
        for (const note of notes) {
            if (note.statut !== 'VALIDEE') {
                note.statut = 'VALIDEE';
                note.validee = true;
                note.dateValidation = new Date();
                note.valideePar = valideePar;
                await note.save();
                notesValidees++;
            }
        }

        res.status(200).json({
            success: true,
            message: `${notesValidees} notes de discipline validées avec succès`,
            data: {
                notesValidees,
                totalNotes: notes.length
            }
        });
    } catch (error) {
        console.error('Erreur lors de la délibération des notes de discipline:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Publier les notes de discipline (rendre visibles aux étudiants)
 */
export const publierNotesDiscipline = async (req, res) => {
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
                message: message.evaluation_non_trouvee
            });
        }

        // Mettre à jour toutes les notes de discipline
        await Discipline.updateMany(
            { evaluation: evaluationId, statut: 'VALIDEE' },
            { 
                statut: 'PUBLIEE',
                publiee: true,
                datePublication: new Date()
            }
        );

        res.status(200).json({
            success: true,
            message: "Notes de discipline publiées avec succès"
        });
    } catch (error) {
        console.error('Erreur lors de la publication des notes de discipline:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Verrouiller les notes de discipline
 */
export const verrouillerNotesDiscipline = async (req, res) => {
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
                message: message.evaluation_non_trouvee
            });
        }

        // Verrouiller toutes les notes de discipline
        await Discipline.updateMany(
            { evaluation: evaluationId },
            { 
                statut: 'VERROUILLEE',
                verrouillee: true,
                dateVerrouillage: new Date()
            }
        );

        res.status(200).json({
            success: true,
            message: "Notes de discipline verrouillées avec succès"
        });
    } catch (error) {
        console.error('Erreur lors du verrouillage des notes de discipline:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Obtenir la note de discipline d'un étudiant pour une évaluation
 */
export const getMaNoteDiscipline = async (req, res) => {
    const { evaluationId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // L'étudiant ne peut voir que sa propre note publiée
        const note = await Discipline.findOne({
            evaluation: evaluationId,
            etudiant: req.user._id,
            statut: { $in: ['PUBLIEE', 'VERROUILLEE'] }
        }).select('-saisiePar -historique');

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note de discipline non trouvée"
            });
        }

        res.status(200).json({
            success: true,
            data: note
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de la note de discipline:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

export const saisieRapideNoteDiscipline = async (req, res) => {
    const {
        evaluation,
        etudiant,
        note,
        appreciationFr,
        appreciationEn,
        manquements,
        bonus,
        saisiePar,
        modifiePar
    } = req.body;
    
    try {
        // Vérifications des champs obligatoires
        if (!evaluation || !etudiant) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire,
                code: 'MISSING_FIELDS'
            });
        }

        // Vérifier que la note est fournie
        if (note === undefined || note === null) {
            return res.status(400).json({
                success: false,
                message: message.note_obligatoire_absent,
                code: 'NOTE_REQUIRED'
            });
        }

        // Vérifier la validité des IDs
        if (!mongoose.Types.ObjectId.isValid(evaluation) || 
            !mongoose.Types.ObjectId.isValid(etudiant)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
                code: 'INVALID_ID'
            });
        }

        // Récupérer l'évaluation
        const eva = await Evaluation.findById(evaluation);
        if (!eva) {
            return res.status(404).json({
                success: false,
                message: message.evaluation_non_trouvee,
                code: 'EVALUATION_NOT_FOUND'
            });
        }

        // Vérifier que l'évaluation n'est pas verrouillée
        if (eva.notesVerrouillees) {
            return res.status(403).json({
                success: false,
                message: message.notes_evaluation_verrouillees,
                code: 'LOCKED'
            });
        }

        // Vérifier que l'étudiant existe
        const etud = await User.findById(etudiant);
        if (!etud) {
            return res.status(404).json({
                success: false,
                message: message.etudiant_non_trouvee,
                code: 'STUDENT_NOT_FOUND'
            });
        }

        // Vérifier que la note est dans les limites
        if (note < eva.noteMin || note > eva.noteMax) {
            return res.status(400).json({
                success: false,
                message: {
                    fr: `La note doit être comprise entre ${eva.noteMin} et ${eva.noteMax}`,
                    en: `Grade must be between ${eva.noteMin} and ${eva.noteMax}`
                },
                code: 'NOTE_OUT_OF_RANGE'
            });
        }

        // Vérifier si une note existe déjà
        const noteExistante = await Discipline.findOne({
            evaluation: evaluation,
            etudiant: etudiant
        });

        let noteSauvegardee;
        let isUpdate = false;

        if (noteExistante) {
            // Mise à jour
            const ancienneNote = noteExistante.note;
            
            noteExistante.note = note;
            noteExistante.appreciationFr = appreciationFr;
            noteExistante.appreciationEn = appreciationEn;
            noteExistante.manquements = manquements || [];
            noteExistante.bonus = bonus || [];
            noteExistante.dateModification = new Date();
            noteExistante.modifiePar = modifiePar;

            noteExistante.historique.push({
                ancienneNote,
                nouvelleNote: note,
                modifiePar: modifiePar,
                dateModification: new Date(),
                raison: "Modification par le responsable"
            });

            noteSauvegardee = await noteExistante.save();
            isUpdate = true;
        } else {
            // Création
            const nouvelleNote = new Discipline({
                evaluation: evaluation,
                etudiant: etudiant,
                note: note,
                noteMax: eva.noteMax,
                appreciationFr,
                appreciationEn,
                manquements: manquements || [],
                bonus: bonus || [],
                saisiePar: saisiePar,
                statut: 'VALIDEE'
            });

            noteSauvegardee = await nouvelleNote.save();
        }

        // Peupler les données pour la réponse
        await noteSauvegardee.populate('etudiant', 'nom prenom matricule');

        res.status(201).json({
            success: true,
            message: isUpdate ? message.mis_a_jour : message.ajouter_avec_success,
            code: isUpdate ? 'UPDATED' : 'CREATED',
            data: noteSauvegardee,
            valide: true
        });
    } catch (error) {
        console.error('Erreur lors de la saisie rapide de la note de discipline:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
            code: 'SERVER_ERROR'
        });
    }
};
