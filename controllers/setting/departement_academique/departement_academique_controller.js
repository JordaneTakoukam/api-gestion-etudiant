import Setting from '../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createDepartement = async (req, res) => {
    const { code, libelleFr, libelleEn } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }
        // Vérifier si le code de la departement existe déjà
        const existingCode = await Setting.findOne({
            'departementsAcademique.code': code,
        });

        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code,
            });
        }
        // Vérifier si le libelle fr de la departement existe déjà
        const existingLibelleFr = await Setting.findOne({
            'departementsAcademique.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en de la departement existe déjà
        const existingLibelleEn = await Setting.findOne({
            'departementsAcademique.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouveau departement
        const newDepartement = { code, libelleFr, libelleEn, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        var data = null;
        if (!setting) {
            // Create the collection and document
            data = await Setting.create({ departementsAcademique: [newDepartement] });
        } else {
            // Update the existing document
            data = await Setting.findOneAndUpdate({}, { $push: { departementsAcademique: newDepartement } }, { new: true });
        }

        // Récupérer le dernier élément du tableau departement
        const newDepartementObject = data.departementsAcademique[data.departementsAcademique.length - 1];

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: newDepartementObject, // Retourner seulement l'objet de departement créé
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
export const readDepartement = async (req, res) => { }


export const readDepartements = async (req, res) => {
    try {
        // Définir la limite par défaut
        const defaultLimit = 10;

        // Extraire le paramètre `limit` de la requête
        let { limit } = req.query;

        // Utiliser la limite par défaut si le paramètre `limit` n'est pas défini ou invalide
        if (!limit || isNaN(parseInt(limit)) || parseInt(limit) < 1) {
            limit = defaultLimit.toString();
        }

        // Récupérer les departement filtrés par date de création avec la limite appliquée
        const filteredDepartement = await Setting.aggregate([
            { $unwind: "$departement" }, // Dérouler le tableau de departement
            { $match: { "departementsAcademique.date_creation": { $exists: true, $ne: null } } }, // Filtrer les departement ayant une date de création définie
            { $sort: { "departementsAcademique.date_creation": -1 } }, // Trier les departement par date de création (du plus récent au plus ancien)
            { $limit: parseInt(limit) } // Appliquer la limite
        ]);

        // Extraire uniquement les champs nécessaires des departement
        const formattedDepartement = filteredDepartement.map(doc => doc.departement);

        // Nombre total d'éléments dans la base de données (à récupérer)
        const totalCount = await Setting.aggregate([
            { $unwind: "$departementsAcademique" }, // Dérouler le tableau de departement
            { $match: { "departementsAcademique.date_creation": { $exists: true, $ne: null } } }, // Filtrer les departement ayant une date de création définie
            { $count: "total" } // Compter le nombre total d'éléments
        ]);

        // Récupérer le nombre total d'éléments (s'il existe)
        const total = totalCount.length > 0 ? totalCount[0].total : 0;

        // Envoyer la réponse avec les données et les informations sur le nombre d'éléments
        res.json({
            success: true,
            count: formattedDepartement.length, // Nombre d'éléments retournés
            totalCount: total, // Nombre total d'éléments dans la base de données
            data: formattedDepartement,
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
export const updateDepartement = async (req, res) => {
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

        // Rechercher le departement correspondant dans la collection Setting
        const departementsAcademique = await Setting.aggregate([
            { $unwind: "$departementsAcademique" }, // Dérouler le tableau de departement
            { $match: { "departementsAcademique._id": new mongoose.Types.ObjectId(id) } }, // Filtrer le departement par son ID
            { $project: { departementsAcademique: 1 } } // Projeter uniquement le departement
        ]);

        // Vérifier si le departement existe
        if (departementsAcademique.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }
        
        const existingDepartement = departementsAcademique[0]. departementsAcademique;
        console.log(departementsAcademique);
        console.log(existingDepartement);

        // Vérifier si les données existantes sont identiques aux nouvelles données
        if (existingDepartement.code === code && existingDepartement.libelleFr === libelleFr && existingDepartement.libelleEn === libelleEn) {
            return res.json({
                success: true,
                message: message.donne_a_jour,
                data: existingDepartement,
            });
        }

        //vérifier si le code existe déjà or mis le code de l'élément en cours de modification
        if (existingDepartement.code !== code) {
            const existingCode = await Setting.findOne({ 'departementsAcademique.code': code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        //vérifier si le libelle fr existe déjà or mis le libelle fr de l'élément en cours de modification
        if (existingDepartement.libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({ 'departementsAcademique.libelleFr': libelleFr });
            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }
        //vérifier si le libelle en existe déjà or mis le libelle en de l'élément en cours de modification
        if (existingDepartement.libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({ 'departementsAcademique.libelleEn': libelleEn });
            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        const updatedDepartement = { ...existingDepartement };

        // Mettre à jour les champs modifiés
        updatedDepartement.code = code;
        updatedDepartement.libelleFr = libelleFr;
        updatedDepartement.libelleEn = libelleEn;

        // Mettre à jour le departement dans la base de données
        await Setting.updateOne(
            { "departementsAcademique._id": new mongoose.Types.ObjectId(id) }, // Trouver le departement par son ID
            { $set: { "departementsAcademique.$": updatedDepartement } } // Mettre à jour le departement
        );

        // Envoyer la réponse avec les données mises à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedDepartement,
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
export const deleteDepartement = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate({}, { $pull: { departement: { _id: new mongoose.Types.ObjectId(id) } } }, { new: true });

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


