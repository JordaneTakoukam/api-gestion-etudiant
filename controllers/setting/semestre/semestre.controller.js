import Setting from '../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create


export const createSemestreCourant = async (req, res) => {
    const { semestre } = req.body;

    try {
        // Vérifier si l'année est présente dans la requête
        if (!semestre) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérifier si la collection "Setting" existe
        let setting = await Setting.findOne();

        if (!setting) {
            // Si la collection n'existe pas, créer un nouveau document avec l'année courante
            setting = new Setting({ semestreCourant: semestre });
        } else {
            // Si la collection existe, mettre à jour l'année courante
            setting.semestreCourant = semestre;
        }

        // Enregistrer ou mettre à jour le document dans la base de données
        const savedSetting = await setting.save();

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: savedSetting.semestreCourant
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: "Erreur interne au serveur"
        });
    }
}

// read
export const readSemestreCourant = async (req, res) => { }


export const readSemestreCourants = async (req, res) => {
    try {
        // Définir la limite par défaut
        const defaultLimit = 10;

        // Extraire le paramètre `limit` de la requête
        let { limit } = req.query;

        // Utiliser la limite par défaut si le paramètre `limit` n'est pas défini ou invalide
        if (!limit || isNaN(parseInt(limit)) || parseInt(limit) < 1) {
            limit = defaultLimit.toString();
        }

        // Récupérer les semestrecourant filtrés par date de création avec la limite appliquée
        const filteredSemestreCourant = await Setting.aggregate([
            { $unwind: "$semestreCourant" }, // Dérouler le tableau de semestrecourant
            { $match: { "semestreCourant.date_creation": { $exists: true, $ne: null } } }, // Filtrer les semestrecourant ayant une date de création définie
            { $sort: { "semestreCourant.date_creation": -1 } }, // Trier les semestrecourant par date de création (du plus récent au plus ancien)
            { $limit: parseInt(limit) } // Appliquer la limite
        ]);

        // Extraire uniquement les champs nécessaires des semestrecourant
        const formattedSemestreCourant = filteredSemestreCourant.map(doc => doc.semestrecourant);

        // Nombre total d'éléments dans la base de données (à récupérer)
        const totalCount = await Setting.aggregate([
            { $unwind: "$typenseignement" }, // Dérouler le tableau de semestrecourant
            { $match: { "semestreCourant.date_creation": { $exists: true, $ne: null } } }, // Filtrer les semestrecourant ayant une date de création définie
            { $count: "total" } // Compter le nombre total d'éléments
        ]);

        // Récupérer le nombre total d'éléments (s'il existe)
        const total = totalCount.length > 0 ? totalCount[0].total : 0;

        // Envoyer la réponse avec les données et les informations sur le nombre d'éléments
        res.json({
            success: true,
            count: formattedSemestreCourant.length, // Nombre d'éléments retournés
            totalCount: total, // Nombre total d'éléments dans la base de données
            data: formattedSemestreCourant,
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
export const updateSemestreCourant = async (req, res) => {
    const { id } = req.params;
    const { code, libelleFr, libelleEn } = req.body;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Rechercher le semestrecourant correspondant dans la collection Setting
        const semestreCourant = await Setting.aggregate([
            { $unwind: "$semestreCourant" }, // Dérouler le tableau de semestrecourant
            { $match: { "semestreCourant._id": new mongoose.Types.ObjectId(id) } }, // Filtrer le semestrecourant par son ID
            { $project: { semestreCourant: 1 } } // Projeter uniquement le semestrecourant
        ]);

        // Vérifier si le semestrecourant existe
        if (semestreCourant.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        const existingSemestreCourant = semestreCourant[0].semestreCourant;

        // Vérifier si les données existantes sont identiques aux nouvelles données
        if (existingSemestreCourant.code === code && existingSemestreCourant.libelleFr === libelleFr && existingSemestreCourant.libelleEn === libelleEn) {
            return res.json({
                success: true,
                message: message.donne_a_jour,
                data: existingSemestreCourant,
            });
        }

        //vérifier si le code existe déjà or mis le code de l'élément en cours de modification
        if (existingSemestreCourant.code !== code) {
            const existingCode = await Setting.findOne({ 'semestreCourant.code': code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        //vérifier si le libelle fr existe déjà or mis le libelle fr de l'élément en cours de modification
        if (existingSemestreCourant.libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({ 'semestreCourant.libelleFr': libelleFr });
            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }
        //vérifier si le libelle en existe déjà or mis le libelle en de l'élément en cours de modification
        if (existingSemestreCourant.libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({ 'semestreCourant.libelleEn': libelleEn });
            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        const updatedSemestreCourant = { ...existingSemestreCourant };

        // Mettre à jour les champs modifiés
        updatedSemestreCourant.code = code;
        updatedSemestreCourant.libelleFr = libelleFr;
        updatedSemestreCourant.libelleEn = libelleEn;

        // Mettre à jour le semestrecourant dans la base de données
        await Setting.updateOne(
            { "semestreCourant._id": new mongoose.Types.ObjectId(id) }, // Trouver le semestrecourant par son ID
            { $set: { "semestreCourant.$": updatedSemestreCourant } } // Mettre à jour le semestrecourant
        );

        // Envoyer la réponse avec les données mises à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedSemestreCourant,
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
export const deleteSemestreCourant = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate({}, { $pull: { semestreCourant: { _id: new mongoose.Types.ObjectId(id) } } }, { new: true });

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


