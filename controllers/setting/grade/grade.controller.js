import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';


// create
export const createGrade = async (req, res) => { 
    const { code, libelleFr, libelleEn } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!libelleFr || !libelleEn) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

         // Vérifier si le code du grade existe déjà
         if(code){
            const existingCode = await Setting.findOne({
                'grades.code': code,
            });
            
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code,
                });
            }
        }
        // Vérifier si le libelle fr du grade existe déjà
        const existingLibelleFr = await Setting.findOne({
            'grades.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en du grade existe déjà
        const existingLibelleEn = await Setting.findOne({
            'grades.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouveau grade
        const newGrade = { code, libelleFr, libelleEn, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        var data = null;
        if (!setting) {
            // Create the collection and document
            data = await Setting.create({ grades: [newGrade] });
        } else {
            // Update the existing document
            data = await Setting.findOneAndUpdate({}, { $push: { grades: newGrade } }, { new: true });
        }

        // Récupérer le dernier élément du tableau grades
        const newGradeObject = data.grades[data.grades.length - 1];

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: newGradeObject, // Retourner seulement l'objet de grade créé
        });

    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
}


// read
export const readGrade = async (req, res) => { }


export const readGrades = async (req, res) => {
    try {
        // Définir la limite par défaut
        const defaultLimit = 10;

        // Extraire le paramètre `limit` de la requête
        let { limit } = req.query;

        // Utiliser la limite par défaut si le paramètre `limit` n'est pas défini ou invalide
        if (!limit || isNaN(parseInt(limit)) || parseInt(limit) < 1) {
            limit = defaultLimit.toString();
        }

        // Récupérer les grades filtrés par date de création avec la limite appliquée
        const filteredGrades = await Setting.aggregate([
            { $unwind: "$grades" }, // Dérouler le tableau de grades
            { $match: { "grades.date_creation": { $exists: true, $ne: null } } }, // Filtrer les grades ayant une date de création définie
            { $sort: { "grades.date_creation": -1 } }, // Trier les grades par date de création (du plus récent au plus ancien)
            { $limit: parseInt(limit) } // Appliquer la limite
        ]);

        // Extraire uniquement les champs nécessaires des grades
        const formattedGrades = filteredGrades.map(doc => doc.grades);

        // Nombre total d'éléments dans la base de données (à récupérer)
        const totalCount = await Setting.aggregate([
            { $unwind: "$grades" }, // Dérouler le tableau de grades
            { $match: { "grades.date_creation": { $exists: true, $ne: null } } }, // Filtrer les grades ayant une date de création définie
            { $count: "total" } // Compter le nombre total d'éléments
        ]);

        // Récupérer le nombre total d'éléments (s'il existe)
        const total = totalCount.length > 0 ? totalCount[0].total : 0;

        // Envoyer la réponse avec les données et les informations sur le nombre d'éléments
        res.json({
            success: true,
            count: formattedGrades.length, // Nombre d'éléments retournés
            totalCount: total, // Nombre total d'éléments dans la base de données
            data: formattedGrades,
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: "Erreur interne au serveur",
        });
    }
}


// update
export const updateGrade = async (req, res) => {
    const { gradeId } = req.params;
    const { code, libelleFr, libelleEn } = req.body;

    try {
        // Vérifier si gradeId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(gradeId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Vérifier si tous les champs obligatoires sont présents
        if (!libelleFr || !libelleEn) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Rechercher le grade correspondant dans la collection Setting
        const grade = await Setting.aggregate([
            { $unwind: "$grades" }, // Dérouler le tableau de grades
            { $match: { "grades._id": new mongoose.Types.ObjectId(gradeId) } }, // Filtrer le grade par son ID
            { $project: { grades: 1 } } // Projeter uniquement le grade
        ]);

        // Vérifier si le grade existe
        if (grade.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        const existingGrade = grade[0].grades;

        // Vérifier si les données existantes sont identiques aux nouvelles données
        if (existingGrade.code === code && existingGrade.libelleFr === libelleFr && existingGrade.libelleEn === libelleEn) {
            return res.json({
                success: true,
                message: message.donne_a_jour,
                data: existingGrade,
            });
        }

        //vérifier si le code existe déjà or mis le code de l'élément en cours de modification
        if (code && existingGrade.code !== code) {
            const existingCode = await Setting.findOne({ 'grades.code': code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        //vérifier si le libelle fr existe déjà or mis le libelle fr de l'élément en cours de modification
        if (existingGrade.libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({ 'grades.libelleFr': libelleFr });
            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }
        //vérifier si le libelle en existe déjà or mis le libelle en de l'élément en cours de modification
        if (existingGrade.libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({ 'grades.libelleEn': libelleEn });
            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        const updatedGrade = { ...existingGrade };

        // Mettre à jour les champs modifiés
        updatedGrade.code = code;
        updatedGrade.libelleFr = libelleFr;
        updatedGrade.libelleEn = libelleEn;

        // Mettre à jour le grade dans la base de données
        await Setting.updateOne(
            { "grades._id": new mongoose.Types.ObjectId(gradeId) }, // Trouver le grade par son ID
            { $set: { "grades.$": updatedGrade } } // Mettre à jour le grade
        );

        // Envoyer la réponse avec les données mises à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedGrade,
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        return res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
}


// delete
export const deleteGrade = async (req, res) => {
    const { gradeId } = req.params;

    try {
        // Vérifier si gradeId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(gradeId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate({}, { $pull: { grades: { _id: new mongoose.Types.ObjectId(gradeId) } } }, { new: true });

        if (!setting) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        res.json({
            success: true,
            message: message.supprimer_avec_success,
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
}


