import Devoir from '../../models/devoirs/devoir.model.js'
import Question from '../../models/devoirs/question.model.js'
import Reponse from '../../models/devoirs/reponse.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';

export const createDevoir = async (req, res) => {
    const {
        titre_fr,
        titre_en,
        description_fr,
        description_en,
        niveau,
        utilisateur,
        questions,
        deadline,
        ordreAleatoire,
        tentativesMax,
        feedbackConfig,
        annee
    } = req.body;

    try {
        // Champs obligatoires
        const requiredFields = ['titre_fr', 'titre_en', 'niveau', 'utilisateur', 'deadline', 'annee'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: message.champ_obligatoire,
                });
            }
        }

        // Vérification de la validité des ObjectIds
        if (!mongoose.Types.ObjectId.isValid(niveau) || !mongoose.Types.ObjectId.isValid(utilisateur)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }
        const newDevoir = new Devoir({
            titre_fr,
            titre_en,
            description_fr,
            description_en,
            niveau,
            questions,
            deadline,
            utilisateur,
            ordreAleatoire: ordreAleatoire || false,
            tentativesMax: tentativesMax || 1,
            feedbackConfig: feedbackConfig || {
                afficherNoteApresSoumission: false,
                afficherCorrectionApresSoumission: false,
                afficherCorrectionApresDeadline: true,
                afficherNoteApresDeadline: true,
            },
           annee
        });

        await newDevoir.save();

        res.status(201).json({
            success: true,
            message: message.ajouter_avec_success,
            data: newDevoir,
        });
    } catch (error) {
        console.error("Erreur lors de la création du devoir :", error);
        res.status(500).json({
            success: false,
            message:message.erreurServeur,
        });
    }
};

export const updateDevoir = async (req, res) => {
    const { id } = req.params;
    const {
        titre_fr,
        titre_en,
        description_fr,
        description_en,
        niveau,
        utilisateur,
        questions,
        deadline,
        ordreAleatoire,
        tentativesMax,
        feedbackConfig,
        annee
    } = req.body;

    try {
        // Champs obligatoires
        const requiredFields = ['titre_fr', 'titre_en', 'niveau', 'utilisateur', 'deadline', 'annee'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: message.champ_obligatoire,
                });
            }
        }

        // Vérification de la validité des ObjectIds
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(niveau) 
            || !mongoose.Types.ObjectId.isValid(utilisateur)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const updatedDevoir = await Devoir.findById(id);
        if (!updatedDevoir) {
            return res.status(404).json({
                success: false,
                message: message.devoir_non_trouve,
            });
        }
        updatedDevoir.titre_fr = titre_fr;
        updatedDevoir.titre_en = titre_en;
        updatedDevoir.description_fr = description_fr;
        updatedDevoir.description_en = description_en;
        updatedDevoir.niveau = niveau;
        updatedDevoir.utilisateur = utilisateur;
        updatedDevoir.questions = questions;
        updatedDevoir.deadline =  deadline;
        updatedDevoir.ordreAleatoire = ordreAleatoire;
        updatedDevoir.tentativesMax = tentativesMax;
        updatedDevoir.feedbackConfig = feedbackConfig;
        updatedDevoir.annee = annee;

        await updatedDevoir.save();

        res.status(200).json({
            success: true,
            message: message.mis_a_jour,
            data: updatedDevoir,
        });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du devoir :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};

export const deleteDevoir = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérification de l'identifiant
        if (!id) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Récupérer le devoir avant suppression pour vérifier son existence et obtenir les questions associées
        const devoir = await Devoir.findById(id);
        if (!devoir) {
            return res.status(404).json({
                success: false,
                message: message.devoir_non_trouve,
            });
        }

        // Supprimer toutes les questions associées au devoir
        await Question.deleteMany({ devoir: id });

        // Supprimer le devoir
        await Devoir.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: message.supprimer_avec_success,
        });
    } catch (error) {
        console.error("Erreur lors de la suppression du devoir :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};


export const getDevoirsByNiveauPaginated = async (req, res) => {
    const { niveauId } = req.params;
    const { page = 1, pageSize = 10, annee} = req.query;

    try {
        if (!niveauId) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire,
            });
        }

        // Calcul de l'offset pour la pagination
        const skip = (parseInt(page) - 1) * parseInt(pageSize);

        // Récupérer les devoirs triés par `createDate`
        const devoirs = await Devoir.find({ niveau: niveauId, annee: annee })
            .sort({ createDate: 1 })
            .skip(skip)
            .limit(parseInt(pageSize));

        // Compter le nombre total de devoirs pour la pagination
        const total = await Devoir.countDocuments({ niveau: niveauId, annee:annee });

        res.status(200).json({
            success: true,
            data: {
                devoirs,
                totalItems : total,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(pageSize)),
                pageSize: pageSize
            },
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des devoirs paginés :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

export const getDevoirsByEnseignantPaginated = async (req, res) => {
    const { enseignantId } = req.params;
    const { page = 1, pageSize = 10, annee} = req.query;

    try {
        if (!enseignantId) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire,
            });
        }

        // Calcul de l'offset pour la pagination
        const skip = (parseInt(page) - 1) * parseInt(pageSize);

        // Récupérer les devoirs triés par `createDate`
        const devoirs = await Devoir.find({ utilisateur: enseignantId, annee: annee })
            .sort({ createDate: 1 })
            .skip(skip)
            .limit(parseInt(pageSize));

        // Compter le nombre total de devoirs pour la pagination
        const total = await Devoir.countDocuments({ utilisateur: enseignantId, annee:annee });

        res.status(200).json({
            success: true,
            data: {
                devoirs,
                totalItems : total,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(pageSize)),
                pageSize: pageSize
            },
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des devoirs paginés :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

export const voirStatistiquesDevoir = async (req, res) => {
    const { devoirId } = req.params;

    try {
        // Vérifier l'existence du devoir
        const devoir = await Devoir.findById(devoirId);
        if (!devoir) {
            return res.status(404).json({
                success: false,
                message: message.devoir_non_trouve,
            });
        }

        // Récupérer toutes les réponses pour le devoir
        const reponses = await Reponse.find({ devoir: devoirId });

        if (reponses.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.pas_de_tentatives,
            });
        }

        // Calculer les statistiques
        const totalTentatives = reponses.reduce((sum, r) => sum + r.tentative.length, 0);
        const scores = reponses.map((r) => r.meilleureScore);
        const moyenne = scores.reduce((a, b) => a + b, 0) / scores.length;
        const meilleureNote = Math.max(...scores);
        const pireNote = Math.min(...scores);

        res.status(200).json({
            success: true,
            data: {
                totalTentatives,
                moyenne,
                meilleureNote,
                pireNote,
            },
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des statistiques :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};




