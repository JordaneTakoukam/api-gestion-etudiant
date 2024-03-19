import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

//
//
//
//
//
//
//
// create
export const createService = async (req, res) => {
    const { code, libelleFr, libelleEn } = req.body;

    try {
         // Vérifier si le code du service existe déjà
         const existingCode = await Setting.findOne({
            'services.code': code,
        });
        
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code,
            });
        }
        // Vérifier si le libelle fr du service existe déjà
        const existingLibelleFr = await Setting.findOne({
            'services.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en du service existe déjà
        const existingLibelleEn = await Setting.findOne({
            'services.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouveau service
        const newService = { code, libelleFr, libelleEn, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        var data = null;
        if (!setting) {
            // Create the collection and document
            data = await Setting.create({ services: [newService] });
        } else {
            // Update the existing document
            data = await Setting.findOneAndUpdate({}, { $push: { services: newService } }, { new: true });
        }

        // Récupérer le dernier élément du tableau services
        const newServiceObject = data.services[data.services.length - 1];

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: newServiceObject, // Retourner seulement l'objet de service créé
        });

    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};



//
//
//
//
//
//
//
// reads
export const readServices = async (req, res) => {
    try {
        // Définir la limite par défaut
        const defaultLimit = 10;

        // Extraire le paramètre `limit` de la requête
        let { limit } = req.query;

        // Utiliser la limite par défaut si le paramètre `limit` n'est pas défini ou invalide
        if (!limit || isNaN(parseInt(limit)) || parseInt(limit) < 1) {
            limit = defaultLimit.toString();
        }

        // Récupérer les services filtrés par date de création avec la limite appliquée
        const filteredServices = await Setting.aggregate([
            { $unwind: "$services" }, // Dérouler le tableau de services
            { $match: { "services.date_creation": { $exists: true, $ne: null } } }, // Filtrer les services ayant une date de création définie
            { $sort: { "services.date_creation": -1 } }, // Trier les services par date de création (du plus récent au plus ancien)
            { $limit: parseInt(limit) } // Appliquer la limite
        ]);

        // Extraire uniquement les champs nécessaires des services
        const formattedServices = filteredServices.map(doc => doc.services);

        // Nombre total d'éléments dans la base de données (à récupérer)
        const totalCount = await Setting.aggregate([
            { $unwind: "$services" }, // Dérouler le tableau de services
            { $match: { "services.date_creation": { $exists: true, $ne: null } } }, // Filtrer les services ayant une date de création définie
            { $count: "total" } // Compter le nombre total d'éléments
        ]);

        // Récupérer le nombre total d'éléments (s'il existe)
        const total = totalCount.length > 0 ? totalCount[0].total : 0;

        // Envoyer la réponse avec les données et les informations sur le nombre d'éléments
        res.json({
            success: true,
            count: formattedServices.length, // Nombre d'éléments retournés
            totalCount: total, // Nombre total d'éléments dans la base de données
            data: formattedServices,
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: "Erreur interne au serveur",
        });
    }
};



//
//
//
//
//
//
//
// update
export const updateService = async (req, res) => {
    const { serviceId } = req.params;
    const { code, libelleFr, libelleEn } = req.body;

    try {
        // Vérifier si serviceId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({
                success: false,
                message: "L'ID du service n'est pas valide.",
            });
        }

        // Rechercher le service correspondant dans la collection Setting
        const service = await Setting.aggregate([
            { $unwind: "$services" }, // Dérouler le tableau de services
            { $match: { "services._id": new mongoose.Types.ObjectId(serviceId) } }, // Filtrer le service par son ID
            { $project: { services: 1 } } // Projeter uniquement le service
        ]);

        // Vérifier si le service existe
        if (service.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        const existingService = service[0].services;

        // Vérifier si les données existantes sont identiques aux nouvelles données
        if (existingService.code === code && existingService.libelleFr === libelleFr && existingService.libelleEn === libelleEn) {
            return res.json({
                success: true,
                message: "Les données du service sont déjà à jour.",
                data: existingService,
            });
        }

        const updatedService = { ...existingService };

        // Mettre à jour les champs modifiés
        if (code !== undefined) {
            updatedService.code = code;
        }
        if (libelleFr !== undefined) {
            updatedService.libelleFr = libelleFr;
        }
        if (libelleEn !== undefined) {
            updatedService.libelleEn = libelleEn;
        }

        // Mettre à jour le service dans la base de données
        await Setting.updateOne(
            { "services._id": new mongoose.Types.ObjectId(serviceId) }, // Trouver le service par son ID
            { $set: { "services.$": updatedService } } // Mettre à jour le service
        );

        // Envoyer la réponse avec les données mises à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedService,
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
export const deleteService = async (req, res) => {
    const { serviceId } = req.params;

    try {
        // Vérifier si serviceId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate({}, { $pull: { services: { _id: new mongoose.Types.ObjectId(serviceId) } } }, { new: true });

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
