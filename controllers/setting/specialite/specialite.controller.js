import Setting from '../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';


// create
export const createSpecialite = async (req, res) => {
    const { code, libelleFr, libelleEn } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!libelleFr || !libelleEn) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }
         // Vérifier si le code du specialite existe déjà
         if(code){
            const existingCode = await Setting.findOne({
                'specialites.code': code,
            });
            
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code,
                });
            }
        }
        // Vérifier si le libelle fr du specialite existe déjà
        const existingLibelleFr = await Setting.findOne({
            'specialites.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en du specialite existe déjà
        const existingLibelleEn = await Setting.findOne({
            'specialites.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouveau specialite
        const newSpecialite = { code, libelleFr, libelleEn, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        var data = null;
        if (!setting) {
            // Create the collection and document
            data = await Setting.create({ specialites: [newSpecialite] });
        } else {
            // Update the existing document
            data = await Setting.findOneAndUpdate({}, { $push: { specialites: newSpecialite } }, { new: true });
        }

        // Récupérer le dernier élément du tableau specialites
        const newSpecialiteObject = data.specialites[data.specialites.length - 1];

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: newSpecialiteObject, // Retourner seulement l'objet de specialite créé
        });

    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};


// reads
export const readSpecialites = async (req, res) => {
    try {
        // Définir la limite par défaut
        const defaultLimit = 10;

        // Extraire le paramètre `limit` de la requête
        let { limit } = req.query;

        // Utiliser la limite par défaut si le paramètre `limit` n'est pas défini ou invalide
        if (!limit || isNaN(parseInt(limit)) || parseInt(limit) < 1) {
            limit = defaultLimit.toString();
        }

        // Récupérer les specialites filtrés par date de création avec la limite appliquée
        const filteredSpecialites = await Setting.aggregate([
            { $unwind: "$specialites" }, // Dérouler le tableau de specialites
            { $match: { "specialites.date_creation": { $exists: true, $ne: null } } }, // Filtrer les specialites ayant une date de création définie
            { $sort: { "specialites.date_creation": -1 } }, // Trier les specialites par date de création (du plus récent au plus ancien)
            { $limit: parseInt(limit) } // Appliquer la limite
        ]);

        // Extraire uniquement les champs nécessaires des specialites
        const formattedSpecialites = filteredSpecialites.map(doc => doc.specialites);

        // Nombre total d'éléments dans la base de données (à récupérer)
        const totalCount = await Setting.aggregate([
            { $unwind: "$specialites" }, // Dérouler le tableau de specialites
            { $match: { "specialites.date_creation": { $exists: true, $ne: null } } }, // Filtrer les specialites ayant une date de création définie
            { $count: "total" } // Compter le nombre total d'éléments
        ]);

        // Récupérer le nombre total d'éléments (s'il existe)
        const total = totalCount.length > 0 ? totalCount[0].total : 0;

        // Envoyer la réponse avec les données et les informations sur le nombre d'éléments
        res.json({
            success: true,
            count: formattedSpecialites.length, // Nombre d'éléments retournés
            totalCount: total, // Nombre total d'éléments dans la base de données
            data: formattedSpecialites,
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: "Erreur interne au serveur",
        });
    }
};


// update
export const updateSpecialite = async (req, res) => {
    const { specialiteId } = req.params;
    const { code, libelleFr, libelleEn } = req.body;

    try {
        // Vérifier si specialiteId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(specialiteId)) {
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

        // Rechercher le specialite correspondant dans la collection Setting
        const specialite = await Setting.aggregate([
            { $unwind: "$specialites" }, // Dérouler le tableau de specialites
            { $match: { "specialites._id": new mongoose.Types.ObjectId(specialiteId) } }, // Filtrer le specialite par son ID
            { $project: { specialites: 1 } } // Projeter uniquement le specialite
        ]);

        // Vérifier si le specialite existe
        if (specialite.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        const existingSpecialite = specialite[0].specialites;

        // Vérifier si les données existantes sont identiques aux nouvelles données
        if (existingSpecialite.code === code && existingSpecialite.libelleFr === libelleFr && existingSpecialite.libelleEn === libelleEn) {
            return res.json({
                success: true,
                message: message.donne_a_jour,
                data: existingSpecialite,
            });
        }

        //vérifier si le code existe déjà or mis le code de l'élément en cours de modification
        if (code && existingSpecialite.code !== code) {
            const existingCode = await Setting.findOne({ 'specialites.code': code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        //vérifier si le libelle fr existe déjà or mis le libelle fr de l'élément en cours de modification
        if (existingSpecialite.libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({ 'specialites.libelleFr': libelleFr });
            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }
        //vérifier si le libelle en existe déjà or mis le libelle en de l'élément en cours de modification
        if (existingSpecialite.libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({ 'specialites.libelleEn': libelleEn });
            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        const updatedSpecialite = { ...existingSpecialite };

        // Mettre à jour les champs modifiés
        updatedSpecialite.code = code;
        updatedSpecialite.libelleFr = libelleFr;
        updatedSpecialite.libelleEn = libelleEn;

        // Mettre à jour le specialite dans la base de données
        await Setting.updateOne(
            { "specialites._id": new mongoose.Types.ObjectId(specialiteId) }, // Trouver le specialite par son ID
            { $set: { "specialites.$": updatedSpecialite } } // Mettre à jour le specialite
        );

        // Envoyer la réponse avec les données mises à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedSpecialite,
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        return res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
}



//
//
//
//
//
//
//
// delete
export const deleteSpecialite = async (req, res) => {
    const { specialiteId } = req.params;

    try {
        // Vérifier si specialiteId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(specialiteId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate({}, { $pull: { specialites: { _id: new mongoose.Types.ObjectId(specialiteId) } } }, { new: true });

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
