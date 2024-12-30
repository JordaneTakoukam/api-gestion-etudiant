import Question from '../../models/devoirs/question.model.js'
import Devoir from '../../models/devoirs/devoir.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';

export const createQuestion = async (req, res) => {
    const { textFr, textEn, type, nbPoint, options, devoir } = req.body;
    try {
        // Vérification des champs obligatoires
        const requiredFields = ['textFr', 'textEn', 'nbPoint', 'type', 'options', 'devoir'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: message.champ_obligatoire,
                });
            }
        }

        // Validation spécifique au type de question
        if (type === 'QCM' && options.length < 2) {
            return res.status(400).json({
                success: false,
                message: message.qcm_incorrect,
            });
        }

        if (type === 'VRAI_FAUX' && options.length !== 2) {
            return res.status(400).json({
                success: false,
                message: message.vf_incorrect,
            });
        }

        // Validation des pourcentages
        const totalPourcentagePositif = options
            .filter(opt => opt.pourcentage > 0)
            .reduce((sum, opt) => sum + opt.pourcentage, 0);
        const totalPourcentageNegatif = options
            .filter(opt => opt.pourcentage < 0)
            .reduce((sum, opt) => sum + opt.pourcentage, 0);

        if (totalPourcentagePositif !== 100) {
            return res.status(400).json({
                success: false,
                message: message.somme_pourcentage_positif,
            });
        }

        if (totalPourcentageNegatif < -100) {
            return res.status(400).json({
                success: false,
                message: message.somme_pourcentage_negatif,
            });
        }

        // Vérifier l'existence du devoir
        const devoirExists = await Devoir.findById(devoir._id);
        if (!devoirExists) {
            return res.status(404).json({
                success: false,
                message: message.devoir_non_trouve
            });
        }

        // Créer et sauvegarder la question
        const question = new Question({ textFr, textEn, type, nbPoint, options, devoir });
        const saveQuestion = await question.save();

        // Ajouter la question au devoir
        await Devoir.findByIdAndUpdate(devoir, { $push: { questions: saveQuestion._id } });

        res.status(201).json({
            success: true,
            message:message.ajouter_avec_success,
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
    const { textFr, textEn, type, nbPoint, options, devoir } = req.body;

    try {
        // Vérification des champs obligatoires
        const requiredFields = ['textFr', 'textEn', 'type', 'nbPoint', 'options', 'devoir'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: message.champ_obligatoire,
                });
            }
        }

        // Vérification de l'existence de la question
        const existQuestion = await Question.findById(id);
        if (!existQuestion) {
            return res.status(404).json({
                success: false,
                message: message.question_non_trouvee
            });
        }

        // Validation spécifique au type de question
        if (type === 'QCM' && options.length < 2) {
            return res.status(400).json({
                success: false,
                message: message.qcm_incorrect
            });
        }

        if (type === 'VRAI_FAUX' && options.length !== 2) {
            return res.status(400).json({
                success: false,
                message: message.vf_incorrect
            });
        }

        // Validation des pourcentages
        const totalPourcentagePositif = options
            .filter(opt => opt.pourcentage > 0)
            .reduce((sum, opt) => sum + opt.pourcentage, 0);
        const totalPourcentageNegatif = options
            .filter(opt => opt.pourcentage < 0)
            .reduce((sum, opt) => sum + opt.pourcentage, 0);

        if (totalPourcentagePositif !== 100) {
            return res.status(400).json({
                success: false,
                message: message.somme_pourcentage_positif
            });
        }

        if (totalPourcentageNegatif < -100) {
            return res.status(400).json({
                success: false,
                message: message.somme_pourcentage_negatif
            });
        }

        // Vérifier l'existence du devoir si modifié
        let newDevoir = null;
        if (devoir && devoir._id.toString() !== String(existQuestion.devoir)) {
            newDevoir = await Devoir.findById(devoir._id);
            if (!newDevoir) {
                return res.status(404).json({
                    success: false,
                    message: message.devoir_non_trouve
                });
            }
        }

        // Mettre à jour l'ancien devoir si le devoir change
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

        existQuestion.textFr = textFr;
        existQuestion.textEn = textEn;
        existQuestion.type = type;
        existQuestion.nbPoint = nbPoint;
        existQuestion.options = options;
        existQuestion.devoir = newDevoir? newDevoir._id:existQuestion.devoir;
       
        await existQuestion.save();

        res.status(200).json({
            success: true,
            message: message.mis_a_jour,
            data: existQuestion,
        });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la question :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};


export const deleteQuestion = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérification de l'existence de la question
        const existQuestion = await Question.findById(id);
        if (!existQuestion) {
            return res.status(404).json({
                success: false,
                message: message.question_non_trouvee,
            });
        }

        // Supprimer la question
        const oldDevoir = await Devoir.findById(existQuestion.devoir);
        if (oldDevoir) {
            oldDevoir.questions = oldDevoir.questions.filter(
                (questionId) => String(questionId) !== id
            );
            await oldDevoir.save();
        }

        await existQuestion.deleteOne();

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

export const obtenirQuestionsDevoirAvecPagination = async (req, res) => {
    const { devoirId } = req.params; // Récupération de l'ID du devoir
    const { page = 1, pageSize = 10 } = req.query; // Paramètres pour la pagination (par défaut page 1, pageSizee 10)

    try {
        // Vérifier si le devoir existe
        const devoir = await Devoir.findById(devoirId);
        if (!devoir) {
            return res.status(404).json({
                success: false,
                message: message.devoir_non_trouve,
            });
        }

        // Récupérer les questions du devoir avec pagination
        const questions = await Question.find({ devoir: devoirId })
            .skip((parseInt(page) - 1) * parseInt(pageSize)) // Sauter les résultats précédents
            .limit(parseInt(pageSize)) // Limiter le nombre de résultats
            .exec();

        // Compter le nombre total de questions
        const totalQuestions = await Question.countDocuments({ devoir: devoirId });

        res.status(200).json({
            success: true,
            data: {
                questions,
                totalItems: totalQuestions,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalQuestions / parseInt(pageSize)),
                pageSize: parseInt(pageSize),
            },
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des questions :", error);
        res.status(500).json({
            success: false,
            message: "Une erreur interne est survenue.",
        });
    }
};

export const obtenirQuestionsDevoir = async (req, res) => {
    const { devoirId } = req.params; // Récupération de l'ID du devoir

    try {
        // Vérifier si le devoir existe
        const devoir = await Devoir.findById(devoirId);
        if (!devoir) {
            return res.status(404).json({
                success: false,
                message: message.devoir_non_trouve,
            });
        }

        // Récupérer les questions du devoir avec pagination
        const questions = await Question.find({ devoir: devoirId })
            .exec();


        res.status(200).json({
            success: true,
            data: {
                questions,
                totalItems: questions.length,
                currentPage: 1,
                totalPages: 1,
                pageSize: questions.length,
            },
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des questions :", error);
        res.status(500).json({
            success: false,
            message: "Une erreur interne est survenue.",
        });
    }
};

export const searchQuestion = async (req, res) => {
    const { langue, searchString } = req.params; // Récupère la chaîne de recherche depuis les paramètres de requête
    let {limit = 10, devoirId} = req.query;
    limit = parseInt(limit);
    // console.log(searchString);
    try {
        // Construire la requête pour filtrer les matières
        let query = {
             textFr: { $regex: `^${searchString}`, $options: 'i' },
             devoir:devoirId,
        }
        if(langue!=='fr'){
            query = {
                textEn: { $regex: `^${searchString}`, $options: 'i' },
                devoir:devoirId,
            }
        }

        let questions = [];

        if(langue ==='fr'){
            questions = await Question.find(query)
                .sort({ textFr: 1 }) 
                .limit(limit); // Limite à 5 résultats
        }else{
            questions = await Question.find(query)
                .sort({textEn: 1 }) 
                .limit(limit); // Limite à 5 résultats
        }
        

        res.json({
            success: true,
            data: {
                questions,
                currentPage: 0,
                totalPages: 1,
                totalItems: questions.length,
                pageSize: 10,
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des matières :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
};



