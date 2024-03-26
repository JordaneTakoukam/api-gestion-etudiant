import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createTypeEnseignement = async (req, res) => { 
    const { code, libelleFr, libelleEn } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }
         // Vérifier si le code du type d'enseignement existe déjà
         const existingCode = await Setting.findOne({
            'typeEnseignement.code': code,
        });
        
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code,
            });
        }
        // Vérifier si le libelle fr du type d'enseignement existe déjà
        const existingLibelleFr = await Setting.findOne({
            'typeEnseignement.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en du type d'enseignement existe déjà
        const existingLibelleEn = await Setting.findOne({
            'typeEnseignement.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouveau typeenseignement
        const newTypeEnseignement = { code, libelleFr, libelleEn, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        var data = null;
        if (!setting) {
            // Create the collection and document
            data = await Setting.create({ typeEnseignement: [newTypeEnseignement] });
        } else {
            // Update the existing document
            data = await Setting.findOneAndUpdate({}, { $push: { typeEnseignement: newTypeEnseignement } }, { new: true });
        }

        // Récupérer le dernier élément du tableau typeenseignement
        const newTypeEnseignementObject = data.typeEnseignement[data.typeEnseignement.length - 1];

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: newTypeEnseignementObject, // Retourner seulement l'objet de typeenseignement créé
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
export const readTypeEnseignement = async (req, res) => { }


export const readTypeEnseignements = async (req, res) => {
    try {
        // Définir la limite par défaut
        const defaultLimit = 10;

        // Extraire le paramètre `limit` de la requête
        let { limit } = req.query;

        // Utiliser la limite par défaut si le paramètre `limit` n'est pas défini ou invalide
        if (!limit || isNaN(parseInt(limit)) || parseInt(limit) < 1) {
            limit = defaultLimit.toString();
        }

        // Récupérer les typeenseignement filtrés par date de création avec la limite appliquée
        const filteredTypeEnseignement = await Setting.aggregate([
            { $unwind: "$typEenseignement" }, // Dérouler le tableau de typeenseignement
            { $match: { "typeEnseignement.date_creation": { $exists: true, $ne: null } } }, // Filtrer les typeenseignement ayant une date de création définie
            { $sort: { "typeEnseignement.date_creation": -1 } }, // Trier les typeenseignement par date de création (du plus récent au plus ancien)
            { $limit: parseInt(limit) } // Appliquer la limite
        ]);

        // Extraire uniquement les champs nécessaires des typeenseignement
        const formattedTypeEnseignement = filteredTypeEnseignement.map(doc => doc.typeenseignement);

        // Nombre total d'éléments dans la base de données (à récupérer)
        const totalCount = await Setting.aggregate([
            { $unwind: "$typenseignement" }, // Dérouler le tableau de typeenseignement
            { $match: { "typeEnseignement.date_creation": { $exists: true, $ne: null } } }, // Filtrer les typeenseignement ayant une date de création définie
            { $count: "total" } // Compter le nombre total d'éléments
        ]);

        // Récupérer le nombre total d'éléments (s'il existe)
        const total = totalCount.length > 0 ? totalCount[0].total : 0;

        // Envoyer la réponse avec les données et les informations sur le nombre d'éléments
        res.json({
            success: true,
            count: formattedTypeEnseignement.length, // Nombre d'éléments retournés
            totalCount: total, // Nombre total d'éléments dans la base de données
            data: formattedTypeEnseignement,
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
export const updateTypeEnseignement = async (req, res) => {
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

        // Rechercher le typeenseignement correspondant dans la collection Setting
        const typeEnseignement = await Setting.aggregate([
            { $unwind: "$typeEnseignement" }, // Dérouler le tableau de typeenseignement
            { $match: { "typeEnseignement._id": new mongoose.Types.ObjectId(id) } }, // Filtrer le typeenseignement par son ID
            { $project: { typeEnseignement: 1 } } // Projeter uniquement le typeenseignement
        ]);

        // Vérifier si le typeenseignement existe
        if (typeEnseignement.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        const existingTypeEnseignement = typeEnseignement[0].typeEnseignement;

        // Vérifier si les données existantes sont identiques aux nouvelles données
        if (existingTypeEnseignement.code === code && existingTypeEnseignement.libelleFr === libelleFr && existingTypeEnseignement.libelleEn === libelleEn) {
            return res.json({
                success: true,
                message: message.donne_a_jour,
                data: existingTypeEnseignement,
            });
        }

        //vérifier si le code existe déjà or mis le code de l'élément en cours de modification
        if (existingTypeEnseignement.code !== code) {
            const existingCode = await Setting.findOne({ 'typeEnseignement.code': code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        //vérifier si le libelle fr existe déjà or mis le libelle fr de l'élément en cours de modification
        if (existingTypeEnseignement.libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({ 'typeEnseignement.libelleFr': libelleFr });
            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }
        //vérifier si le libelle en existe déjà or mis le libelle en de l'élément en cours de modification
        if (existingTypeEnseignement.libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({ 'typeEnseignement.libelleEn': libelleEn });
            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        const updatedTypeEnseignement = { ...existingTypeEnseignement };

        // Mettre à jour les champs modifiés
        updatedTypeEnseignement.code = code;
        updatedTypeEnseignement.libelleFr = libelleFr;
        updatedTypeEnseignement.libelleEn = libelleEn;

        // Mettre à jour le typeenseignement dans la base de données
        await Setting.updateOne(
            { "typeEnseignement._id": new mongoose.Types.ObjectId(id) }, // Trouver le typeenseignement par son ID
            { $set: { "typeEnseignement.$": updatedTypeEnseignement } } // Mettre à jour le typeenseignement
        );

        // Envoyer la réponse avec les données mises à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedTypeEnseignement,
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
export const deleteTypeEnseignement = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate({}, { $pull: { typeEnseignement: { _id: new mongoose.Types.ObjectId(id) } } }, { new: true });

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


