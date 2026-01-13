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
                message: message.note_obligatoire_absent
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

        // Vérifier que la matière fait partie de l'évaluation
        const matiereExiste = eva.matieres.some(
            m => m.matiere.toString() === matiere
        );
        if (!matiereExiste) {
            return res.status(400).json({
                success: false,
                message: message.matiere_non_evaluation
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
                message: message.anonymat_invalide_inexistant,
                valide: false
            });
        }

        if (ano.invalide) {
            return res.status(400).json({
                success: false,
                message: message.anonymat_invalider,
                raison: ano.raisonInvalidation
            });
        }

        // Vérifier que la note est dans les limites
        if (!absent && (note < eva.noteMin || note > eva.noteMax)) {
            return res.status(400).json({
                success: false,
                message: `${message.note_comprise} ${eva.noteMin} - ${eva.noteMax}`
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
                statut: 'VALIDEE'
            });

            noteSauvegardee = await nouvelleNote.save();

            // Marquer l'anonymat comme utilisé
            ano.utilise = true;
            ano.statut = 'UTILISE';
            await ano.save();
        }

        res.status(201).json({
            success: true,
            message: noteExistante ? message.mis_a_jour : message.ajouter_avec_success,
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
    const {valideePar} = req.query;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Vérifier que l'utilisateur est admin
        // if (!req.user.roles.includes(appConfigs.role.admin) && 
        //     !req.user.roles.includes(appConfigs.role.superAdmin)) {
        //     return res.status(403).json({
        //         success: false,
        //         message: "Accès refusé. Réservé aux administrateurs."
        //     });
        // }

        const evaluation = await Evaluation.findById(evaluationId);
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: message.evaluation_non_trouvee
            });
        }

        // Vérifier que l'évaluation est en phase de délibération
        // if (evaluation.statut !== 'DELIBERATION') {
        //     return res.status(400).json({
        //         success: false,
        //         message: "L'évaluation doit être en phase de délibération"
        //     });
        // }

        // Récupérer toutes les notes de cette évaluation
        const notes = await Note.find({ evaluation: evaluationId })
            .populate('anonymat');

        if (notes.length === 0) {
            return res.status(400).json({
                success: false,
                message: message.aucune_note_a_deliberer
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
                note.valideePar = valideePar;
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
            message: message.deliberation_effectuee,
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
                message: message.evaluation_non_trouvee
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
            message: message.publie_succes
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
                message: message.evaluation_non_trouvee
            });
        }

        if (evaluation.notesVerrouillees) {
            return res.status(400).json({
                success: false,
                message: message.notes_deja_verrouillees
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
            message: message.notes_verrouillees
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


/**
 * Obtenir les résultats détaillés d'une évaluation
 * Retourne pour chaque étudiant :
 * - Notes par matière avec coefficient
 * - Moyenne générale
 * - Rang
 */
export const getResultatsDetaillesEvaluation = async (req, res) => {
    const { evaluationId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Récupérer l'évaluation avec les matières
        const evaluation = await Evaluation.findById(evaluationId)
            .populate('matieres.matiere', 'libelleFr libelleEn code');

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: message.evaluation_non_trouvee
            });
        }

        // Vérifier que l'évaluation est publiée
        if (!['PUBLIEE', 'VERROUILEE', 'DELIBERATION'].includes(evaluation.statut)) {
            return res.status(403).json({
                success: false,
                message: message.resultats_non_publie
            });
        }

        // Récupérer toutes les notes de l'évaluation
        const notes = await Note.find({
            evaluation: evaluationId,
            statut: { $in: ['VALIDEE', 'PUBLIEE', 'VERROUILLEE'] }
        })
        .populate('etudiant', 'nom prenom matricule email')
        .populate('matiere', 'libelleFr libelleEn code')
        .sort({ 'etudiant.matricule': 1 });
        

        // Grouper les notes par étudiant
        const notesParEtudiant = {};

        for (const note of notes) {
            if (!note.etudiant) continue;

            const etudiantId = note.etudiant._id.toString();

            if (!notesParEtudiant[etudiantId]) {
                notesParEtudiant[etudiantId] = {
                    etudiant: {
                        _id: note.etudiant._id,
                        nom: note.etudiant.nom,
                        prenom: note.etudiant.prenom,
                        matricule: note.etudiant.matricule,
                        email: note.etudiant.email
                    },
                    notes: [],
                    totalPoints: 0,
                    totalCoefficients: 0,
                    moyenne: null,
                    nombreAbsences: 0,
                    nombreFraudes: 0
                };
            }

            // Trouver le coefficient de la matière dans l'évaluation
            const matiereEval = evaluation.matieres.find(
                m => m.matiere._id.toString() === note.matiere._id.toString()
            );


            const coefficient = matiereEval ? matiereEval.coefficient : 1;

            // Ajouter la note
            notesParEtudiant[etudiantId].notes.push({
                matiere: {
                    _id: note.matiere._id,
                    libelleFr: note.matiere.libelleFr,
                    libelleEn: note.matiere.libelleEn,
                    code: note.matiere.code
                },
                coefficient: coefficient,
                note: note.note,
                noteMax: note.noteMax,
                noteRamenee20: (note.note / note.noteMax) * 20, // Ramener sur 20
                appreciationFr: note.appreciationFr,
                appreciationEn: note.appreciationEn,
                absent: note.absent,
                fraude: note.fraude,
                copieBlanche: note.copieBlanche
            });
            
            // Calculer les totaux (seulement si pas absent)
            if (!note.absent) {
                const noteRamenee20 = (note.note / note.noteMax) * 20;
                notesParEtudiant[etudiantId].totalPoints += noteRamenee20 * coefficient;
                notesParEtudiant[etudiantId].totalCoefficients += coefficient;
            } else {
                notesParEtudiant[etudiantId].nombreAbsences++;
            }

            if (note.fraude) {
                notesParEtudiant[etudiantId].nombreFraudes++;
            }
        }

        // Calculer les moyennes
        const resultatsArray = Object.values(notesParEtudiant);

        for (const resultat of resultatsArray) {
            if (resultat.totalCoefficients > 0) {
                resultat.moyenne = parseFloat(
                    (resultat.totalPoints / resultat.totalCoefficients).toFixed(2)
                );
            } else {
                resultat.moyenne = null;
            }
        }

        // Trier par moyenne décroissante pour calculer les rangs
        const resultatsTriesParMoyenne = resultatsArray
            .filter(r => r.moyenne !== null)
            .sort((a, b) => (b.moyenne || 0) - (a.moyenne || 0));

        // Attribuer les rangs
        let rangActuel = 1;
        let moyennePrecedente = null;
        let nombreEtudiantsMoyennePrecedente = 0;

        for (let i = 0; i < resultatsTriesParMoyenne.length; i++) {
            const resultat = resultatsTriesParMoyenne[i];

            if (moyennePrecedente !== null && resultat.moyenne === moyennePrecedente) {
                // Même moyenne que le précédent = même rang
                resultat.rang = rangActuel;
                nombreEtudiantsMoyennePrecedente++;
            } else {
                // Nouvelle moyenne
                if (moyennePrecedente !== null) {
                    rangActuel += nombreEtudiantsMoyennePrecedente + 1;
                }
                resultat.rang = rangActuel;
                moyennePrecedente = resultat.moyenne;
                nombreEtudiantsMoyennePrecedente = 0;
            }
        }

        // Les étudiants sans moyenne n'ont pas de rang
        const etudiantsSansMoyenne = resultatsArray.filter(r => r.moyenne === null);
        for (const resultat of etudiantsSansMoyenne) {
            resultat.rang = null;
        }

        // Trier le résultat final par rang (puis par matricule pour ceux sans rang)
        resultatsArray.sort((a, b) => {
            if (a.rang !== null && b.rang !== null) {
                return a.rang - b.rang;
            }
            if (a.rang !== null) return -1;
            if (b.rang !== null) return 1;
            return a.etudiant.matricule.localeCompare(b.etudiant.matricule);
        });

        // Calculer les statistiques globales
        const moyennesValides = resultatsTriesParMoyenne.map(r => r.moyenne);
        const statistiques = {
            nombreEtudiants: resultatsArray.length,
            nombreMoyennesCalculees: moyennesValides.length,
            moyenneClasse: moyennesValides.length > 0 
                ? parseFloat((moyennesValides.reduce((a, b) => a + b, 0) / moyennesValides.length).toFixed(2))
                : null,
            moyenneMax: moyennesValides.length > 0 ? Math.max(...moyennesValides) : null,
            moyenneMin: moyennesValides.length > 0 ? Math.min(...moyennesValides) : null,
            nombreAdmis: moyennesValides.filter(m => m >= 10).length,
            nombreAjournes: moyennesValides.filter(m => m < 10).length,
            tauxReussite: moyennesValides.length > 0 
                ? parseFloat(((moyennesValides.filter(m => m >= 10).length / moyennesValides.length) * 100).toFixed(2))
                : null
        };

        // Informations sur l'évaluation
        const evaluationInfo = {
            _id: evaluation._id,
            libelleFr: evaluation.libelleFr,
            libelleEn: evaluation.libelleEn,
            type: evaluation.type,
            annee: evaluation.annee,
            semestre: evaluation.semestre,
            dateEpreuve: evaluation.dateEpreuve,
            datePublication: evaluation.datePublication,
            statut: evaluation.statut,
            noteMax: evaluation.noteMax,
            matieres: evaluation.matieres.map(m => ({
                _id: m.matiere._id,
                libelleFr: m.matiere.libelleFr,
                libelleEn: m.matiere.libelleEn,
                code: m.matiere.code,
                coefficient: m.coefficient
            }))
        };

        res.status(200).json({
            success: true,
            data: {
                evaluation: evaluationInfo,
                resultats: resultatsArray,
                statistiques: statistiques
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des résultats détaillés:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Obtenir les résultats d'un étudiant spécifique pour une évaluation
 * (Vue étudiant - uniquement ses propres résultats)
 */
export const getMesResultatsDetailles = async (req, res) => {
    const { evaluationId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const evaluation = await Evaluation.findById(evaluationId)
            .populate('matieres.matiere', 'libelleFr libelleEn code');

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: message.evaluation_non_trouvee
            });
        }

        // Vérifier que l'évaluation est publiée
        if (!['PUBLIEE', 'VERROUILEE'].includes(evaluation.statut)) {
            return res.status(403).json({
                success: false,
                message:message.resultats_non_publie
            });
        }

        // Récupérer les notes de l'étudiant
        const notes = await Note.find({
            evaluation: evaluationId,
            etudiant: req.user._id,
            statut: { $in: ['VALIDEE', 'PUBLIEE', 'VERROUILLEE'] }
        })
        .populate('matiere', 'libelleFr libelleEn code');

        if (notes.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.note_non_trouvee
            });
        }

        // Construire les résultats
        let totalPoints = 0;
        let totalCoefficients = 0;
        const notesDetailees = [];

        for (const note of notes) {
            const matiereEval = evaluation.matieres.find(
                m => m.matiere._id.toString() === note.matiere._id.toString()
            );

            const coefficient = matiereEval ? matiereEval.coefficient : 1;
            const noteRamenee20 = (note.note / note.noteMax) * 20;

            notesDetailees.push({
                matiere: {
                    _id: note.matiere._id,
                    libelleFr: note.matiere.libelleFr,
                    libelleEn: note.matiere.libelleEn,
                    code: note.matiere.code
                },
                coefficient: coefficient,
                note: note.note,
                noteMax: note.noteMax,
                noteRamenee20: parseFloat(noteRamenee20.toFixed(2)),
                appreciationFr: note.appreciationFr,
                appreciationEn: note.appreciationEn,
                absent: note.absent,
                fraude: note.fraude,
                copieBlanche: note.copieBlanche
            });

            if (!note.absent) {
                totalPoints += noteRamenee20 * coefficient;
                totalCoefficients += coefficient;
            }
        }

        const moyenne = totalCoefficients > 0 
            ? parseFloat((totalPoints / totalCoefficients).toFixed(2))
            : null;

        // Calculer le rang de l'étudiant
        const tousLesResultats = await calculerTousMoyennes(evaluationId);
        const rang = tousLesResultats.findIndex(
            r => r.etudiantId.toString() === req.user._id.toString()
        ) + 1;

        const evaluationInfo = {
            _id: evaluation._id,
            libelleFr: evaluation.libelleFr,
            libelleEn: evaluation.libelleEn,
            type: evaluation.type,
            annee: evaluation.annee,
            semestre: evaluation.semestre,
            dateEpreuve: evaluation.dateEpreuve,
            datePublication: evaluation.datePublication,
            noteMax: evaluation.noteMax
        };

        res.status(200).json({
            success: true,
            data: {
                evaluation: evaluationInfo,
                notes: notesDetailees,
                moyenne: moyenne,
                rang: rang > 0 ? rang : null,
                totalEtudiants: tousLesResultats.length,
                admis: moyenne !== null && moyenne >= 10
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des résultats:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Fonction helper pour calculer toutes les moyennes (pour le classement)
 */
async function calculerTousMoyennes(evaluationId) {
    const evaluation = await Evaluation.findById(evaluationId);
    
    const notes = await Note.find({
        evaluation: evaluationId,
        statut: { $in: ['VALIDEE', 'PUBLIEE', 'VERROUILLEE'] }
    }).populate('matiere');

    const notesParEtudiant = {};

    for (const note of notes) {
        if (!note.etudiant) continue;

        const etudiantId = note.etudiant.toString();

        if (!notesParEtudiant[etudiantId]) {
            notesParEtudiant[etudiantId] = {
                etudiantId: note.etudiant,
                totalPoints: 0,
                totalCoefficients: 0
            };
        }

        if (!note.absent) {
            const matiereEval = evaluation.matieres.find(
                m => m.matiere.toString() === note.matiere._id.toString()
            );
            const coefficient = matiereEval ? matiereEval.coefficient : 1;
            const noteRamenee20 = (note.note / note.noteMax) * 20;

            notesParEtudiant[etudiantId].totalPoints += noteRamenee20 * coefficient;
            notesParEtudiant[etudiantId].totalCoefficients += coefficient;
        }
    }

    const resultats = Object.values(notesParEtudiant)
        .map(r => ({
            etudiantId: r.etudiantId,
            moyenne: r.totalCoefficients > 0 
                ? r.totalPoints / r.totalCoefficients 
                : null
        }))
        .filter(r => r.moyenne !== null)
        .sort((a, b) => (b.moyenne || 0) - (a.moyenne || 0));

    return resultats;
}

/**
 * Exporter les résultats en Excel (ADMIN uniquement)
 */
export const exporterResultatsExcel = async (req, res) => {
    const { evaluationId } = req.params;
    const {section} = req.query;

    try {
        if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const evaluation = await Evaluation.findById(evaluationId)
            .populate('matieres.matiere', 'libelleFr libelleEn code');

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: message.evaluation_non_trouvee
            });
        }

        // Récupérer tous les résultats en appelant directement la logique
        const notes = await Note.find({
            evaluation: evaluationId,
            statut: { $in: ['VALIDEE', 'PUBLIEE', 'VERROUILLEE'] }
        })
        .populate('etudiant', 'nom prenom matricule email')
        .populate('matiere', 'libelleFr libelleEn code')
        .sort({ 'etudiant.matricule': 1 });

        // Grouper les notes par étudiant
        const notesParEtudiant = {};

        for (const note of notes) {
            if (!note.etudiant) continue;

            const etudiantId = note.etudiant._id.toString();

            if (!notesParEtudiant[etudiantId]) {
                notesParEtudiant[etudiantId] = {
                    etudiant: {
                        _id: note.etudiant._id,
                        nom: note.etudiant.nom,
                        prenom: note.etudiant.prenom,
                        matricule: note.etudiant.matricule
                    },
                    notes: [],
                    totalPoints: 0,
                    totalCoefficients: 0,
                    moyenne: null
                };
            }

            const matiereEval = evaluation.matieres.find(
                m => m.matiere._id.toString() === note.matiere._id.toString()
            );

            const coefficient = matiereEval ? matiereEval.coefficient : 1;
            const noteRamenee20 = (note.note / note.noteMax) * 20;

            notesParEtudiant[etudiantId].notes.push({
                matiere: {
                    _id: note.matiere._id,
                    libelleFr: note.matiere.libelleFr,
                    libelleEn: note.matiere.libelleEn,
                    code: note.matiere.code
                },
                coefficient: coefficient,
                note: note.note,
                noteMax: note.noteMax,
                noteRamenee20: noteRamenee20,
                noteCoef: noteRamenee20 * coefficient,
                absent: note.absent
            });

            if (!note.absent) {
                notesParEtudiant[etudiantId].totalPoints += noteRamenee20 * coefficient;
                notesParEtudiant[etudiantId].totalCoefficients += coefficient;
            }
        }

        // Calculer les moyennes et rangs
        const resultatsArray = Object.values(notesParEtudiant);

        for (const resultat of resultatsArray) {
            if (resultat.totalCoefficients > 0) {
                resultat.moyenne = parseFloat(
                    (resultat.totalPoints / resultat.totalCoefficients).toFixed(2)
                );
            }
        }

        const resultatsTriesParMoyenne = resultatsArray
            .filter(r => r.moyenne !== null)
            .sort((a, b) => (b.moyenne || 0) - (a.moyenne || 0));

        let rangActuel = 1;
        let moyennePrecedente = null;
        let nombreEtudiantsMoyennePrecedente = 0;

        for (let i = 0; i < resultatsTriesParMoyenne.length; i++) {
            const resultat = resultatsTriesParMoyenne[i];

            if (moyennePrecedente !== null && resultat.moyenne === moyennePrecedente) {
                resultat.rang = rangActuel;
                nombreEtudiantsMoyennePrecedente++;
            } else {
                if (moyennePrecedente !== null) {
                    rangActuel += nombreEtudiantsMoyennePrecedente + 1;
                }
                resultat.rang = rangActuel;
                moyennePrecedente = resultat.moyenne;
                nombreEtudiantsMoyennePrecedente = 0;
            }
        }

        resultatsArray.sort((a, b) => {
            if (a.rang !== null && b.rang !== null) return a.rang - b.rang;
            if (a.rang !== null) return -1;
            if (b.rang !== null) return 1;
            return a.etudiant.matricule.localeCompare(b.etudiant.matricule);
        });

        // Créer le fichier Excel avec ExcelJS
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Résultats');

        // Titre
        const totalCols = 4 + evaluation.matieres.length + 3; // Nom, Prénom, Matricule, Rang + Matières + Total, TotalCoef, Moyenne
        worksheet.mergeCells('A1', String.fromCharCode(65 + totalCols - 1) + '1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = evaluation.libelleFr;
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };

        // Informations de l'évaluation
        worksheet.getRow(2).values = ['Année:', evaluation.annee, 'Semestre:', evaluation.semestre, section, 'Date:', new Date().toLocaleDateString()];
        worksheet.getRow(2).font = { bold: true };

        // En-têtes
        const headers = [
            'Rang',
            'Matricule',
            'Nom',
            'Prénom',
            ...evaluation.matieres.map(m => `${m.matiere.libelleFr}\n(Coef ${m.coefficient})`),
            'Total\n(Note×Coef)',
            'Total\nCoef',
            'Moyenne'
        ];

        const headerRow = worksheet.getRow(4);
        headerRow.values = headers;
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        headerRow.height = 40;

        // Données
        let currentRow = 5;
        for (const resultat of resultatsArray) {
            const row = worksheet.getRow(currentRow);
            
            const rowData = [
                resultat.rang || '-',
                resultat.etudiant.matricule,
                resultat.etudiant.nom,
                resultat.etudiant.prenom,
                ...evaluation.matieres.map(m => {
                    const note = resultat.notes.find(
                        n => n.matiere._id.toString() === m.matiere._id.toString()
                    );
                    if (!note) return '-';
                    if (note.absent) return 'ABS';
                    return note.noteRamenee20.toFixed(2);
                }),
                resultat.totalPoints > 0 ? resultat.totalPoints.toFixed(2) : '-',
                resultat.totalCoefficients > 0 ? resultat.totalCoefficients : '-',
                resultat.moyenne !== null ? resultat.moyenne.toFixed(2) : '-'
            ];

            row.values = rowData;
            row.alignment = { horizontal: 'center', vertical: 'middle' };

            // Coloration de la moyenne
            const moyenneColIndex = 5 + evaluation.matieres.length + 2; // Après rang, matricule, nom, prénom, matières, total, totalCoef
            const moyenneCell = row.getCell(moyenneColIndex);
            if (resultat.moyenne !== null) {
                moyenneCell.font = { bold: true, size: 12 };
                moyenneCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: resultat.moyenne >= 10 ? 'FF70AD47' : 'FFC00000' }
                };
                moyenneCell.font = { ...moyenneCell.font, color: { argb: 'FFFFFFFF' } };
            }

            // Coloration du rang (or, argent, bronze)
            const rangCell = row.getCell(1);
            if (resultat.rang === 1) {
                rangCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } }; // Or
                rangCell.font = { bold: true, size: 12 };
            } else if (resultat.rang === 2) {
                rangCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } }; // Argent
                rangCell.font = { bold: true, size: 12 };
            } else if (resultat.rang === 3) {
                rangCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCD7F32' } }; // Bronze
                rangCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
            }

            // Coloration des notes (vert si >=10, rouge si <10)
            for (let i = 0; i < evaluation.matieres.length; i++) {
                const noteCell = row.getCell(5 + i);
                const noteValue = noteCell.value;
                if (noteValue !== 'ABS' && noteValue !== '-' && !isNaN(parseFloat(noteValue))) {
                    const note = parseFloat(noteValue);
                    if (note >= 10) {
                        noteCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
                    } else {
                        noteCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
                    }
                }
            }

            // Style pour Total (Note×Coef) et Total Coef
            const totalCell = row.getCell(5 + evaluation.matieres.length);
            const totalCoefCell = row.getCell(5 + evaluation.matieres.length + 1);
            totalCell.font = { bold: true };
            totalCoefCell.font = { bold: true };
            totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };
            totalCoefCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };

            currentRow++;
        }

        // Bordures
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 4) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } }
                    };
                });
            }
        });

        // Ajuster la largeur des colonnes
        worksheet.columns = [
            { width: 8 },   // Rang
            { width: 15 },  // Matricule
            { width: 20 },  // Nom
            { width: 20 },  // Prénom
            ...evaluation.matieres.map(() => ({ width: 12 })), // Matières
            { width: 14 },  // Total (Note×Coef)
            { width: 12 },  // Total Coef
            { width: 12 }   // Moyenne
        ];

        // Statistiques en bas
        const statsRow = currentRow + 2;
        worksheet.mergeCells(`A${statsRow}`, `D${statsRow}`);
        const statsTitle = worksheet.getCell(`A${statsRow}`);
        statsTitle.value = 'STATISTIQUES DE LA PROMOTION';
        statsTitle.font = { bold: true, size: 13 };
        statsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        statsTitle.font = { ...statsTitle.font, color: { argb: 'FFFFFFFF' } };
        statsTitle.alignment = { horizontal: 'center', vertical: 'middle' };
        
        const moyennesValides = resultatsTriesParMoyenne.map(r => r.moyenne);
        const stats = {
            nombreEtudiants: resultatsArray.length,
            moyenneClasse: moyennesValides.length > 0 
                ? (moyennesValides.reduce((a, b) => a + b, 0) / moyennesValides.length).toFixed(2)
                : 'N/A',
            moyenneMax: moyennesValides.length > 0 ? Math.max(...moyennesValides).toFixed(2) : 'N/A',
            moyenneMin: moyennesValides.length > 0 ? Math.min(...moyennesValides).toFixed(2) : 'N/A',
            nombreAdmis: moyennesValides.filter(m => m >= 10).length,
            nombreAjournes: moyennesValides.filter(m => m < 10).length,
            tauxReussite: moyennesValides.length > 0 
                ? ((moyennesValides.filter(m => m >= 10).length / moyennesValides.length) * 100).toFixed(2)
                : 'N/A'
        };

        let statRowNum = statsRow + 1;
        const statLabels = [
            ['Nombre d\'étudiants:', stats.nombreEtudiants],
            ['Moyenne de classe:', stats.moyenneClasse],
            ['Moyenne maximale:', stats.moyenneMax],
            ['Moyenne minimale:', stats.moyenneMin],
            ['Nombre d\'admis:', stats.nombreAdmis],
            ['Nombre d\'ajournés:', stats.nombreAjournes],
            ['Taux de réussite:', `${stats.tauxReussite}%`]
        ];

        statLabels.forEach(([label, value]) => {
            const row = worksheet.getRow(statRowNum);
            row.getCell(1).value = label;
            row.getCell(2).value = value;
            row.getCell(1).font = { bold: true };
            row.getCell(2).font = { bold: true, color: { argb: 'FF0000FF' } };
            statRowNum++;
        });

        // Générer le fichier
        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition', 
            `attachment; filename=Resultats_${evaluation.libelleFr.replace(/\s/g, '_')}_${Date.now()}.xlsx`
        );
        res.send(buffer);

    } catch (error) {
        console.error('Erreur lors de l\'export Excel:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};