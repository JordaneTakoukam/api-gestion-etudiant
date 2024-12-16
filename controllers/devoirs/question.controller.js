import Question from '../../models/devoirs/question.model.js'
import Devoir from '../../models/devoirs/devoir.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';

export const createQuestion = async (req, res) => {
    const { text, type, options, correctAnswer, devoir } = req.body;

    try {
        // Vérification des champs obligatoires
        const requiredFields = ['text', 'type', 'correctAnswer', 'devoir'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: `${field} est un champ obligatoire.`,
                });
            }
        }

        // Validation spécifique au type de question
        if (type === 'QCM' && (!options || options.length < 2)) {
            return res.status(400).json({
                success: false,
                message: message.qcm_incorrect,
            });
        }

        if (type === 'VRAI_FAUX' && !['Vrai', 'Faux'].includes(correctAnswer)) {
            return res.status(400).json({
                success: false,
                message: message.vf_incorrect,
            });
        }

        // Vérifier l'existence du devoir
        const devoirExists = await Devoir.findById(devoir);
        if (!devoirExists) {
            return res.status(404).json({
                success: false,
                message: message.devoir_non_trouve,
            });
        }

        // Créer et sauvegarder la question
        const question = new Question({ text, type, options, correctAnswer, devoir });
        const saveQuestion = await question.save();
        await Devoir.findByIdAndUpdate(devoir, { $push: { questions: saveQuestion._id } });
        res.status(201).json({
            success: true,
            message: message.ajouter_avec_success,
            data: saveQuestion,
        });
    } catch (error) {
        console.error("Erreur lors de la création de la question :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

export const updateQuestion = async (req, res) => {
    const { id } = req.params;
    const { text, type, options, correctAnswer, devoir } = req.body;

    try {
        // Vérification de l'existence de la question
        const existQuestion = await Question.findById(id);
        if (!existQuestion) {
            return res.status(404).json({
                success: false,
                message: message.question_non_trouvee,
            });
        }

        // Validation spécifique au type de question
        if (type === 'QCM' && (!options || options.length < 2)) {
            return res.status(400).json({
                success: false,
                message: message.qcm_incorrect,
            });
        }

        if (type === 'VRAI_FAUX' && !['Vrai', 'Faux'].includes(correctAnswer)) {
            return res.status(400).json({
                success: false,
                message: message.vf_incorrect,
            });
        }

        // Vérifier l'existence du devoir si modifié
        let newDevoir = null;
        if (devoir && devoir !== String(existQuestion.devoir)) {
            newDevoir = await Devoir.findById(devoir);
            if (!newDevoir) {
                return res.status(404).json({
                    success: false,
                    message: message.devoir_non_trouve,
                });
            }
        }

        // Mise à jour de l'ancien devoir (si le devoir change)
        if (newDevoir) {
            const oldDevoir = await Devoir.findById(existQuestion.devoir);
            if (oldDevoir) {
                oldDevoir.questions = oldDevoir.questions.filter(
                    (questionId) => String(questionId) !== id
                );
                await oldDevoir.save();
            }

            // Ajouter la question au nouveau devoir
            newDevoir.questions.push(existQuestion._id);
            await newDevoir.save();
        }

        // Mettre à jour les champs de la question
        existQuestion.text = text;
        existQuestion.type = type;
        existQuestion.options = options;
        existQuestion.correctAnswer = correctAnswer;
        existQuestion.devoir = newDevoir ? newDevoir._id : existQuestion.devoir;

        await existQuestion.save();

        res.status(200).json({
            success: true,
            message: message.mis_a_jour,
            data: existQuestion,
        });
    } catch (error) {
        console.error("Erreur lors de la modification de la question :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};

export const deleteQuestion = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérification de l'existence de la question
        const question = await Question.findById(id);
        if (!question) {
            return res.status(404).json({
                success: false,
                message: message.question_non_trouvee,
            });
        }

        // Supprimer la question
        await question.deleteOne();

        res.status(200).json({
            success: true,
            message: message.supprimer_avec_success,
        });
    } catch (error) {
        console.error("Erreur lors de la suppression de la question :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};


