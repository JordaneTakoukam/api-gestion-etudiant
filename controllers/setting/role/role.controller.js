import Setting from '../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createRole = async (req, res) => { 
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
            'roles.code': code,
        });
        
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code,
            });
        }
        // Vérifier si le libelle fr du type d'enseignement existe déjà
        const existingLibelleFr = await Setting.findOne({
            'roles.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en du type d'enseignement existe déjà
        const existingLibelleEn = await Setting.findOne({
            'roles.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouveau role
        const newRole = { code, libelleFr, libelleEn, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        var data = null;
        if (!setting) {
            // Create the collection and document
            data = await Setting.create({ roles: [newRole] });
        } else {
            // Update the existing document
            data = await Setting.findOneAndUpdate({}, { $push: { roles: newRole } }, { new: true });
        }

        // Récupérer le dernier élément du tableau role
        const newRoleObject = data.roles[data.roles.length - 1];

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: newRoleObject, // Retourner seulement l'objet de role créé
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
export const readRole = async (req, res) => { }


export const readRoles = async (req, res) => {
    try {
        // Définir la limite par défaut
        const defaultLimit = 10;

        // Extraire le paramètre `limit` de la requête
        let { limit } = req.query;

        // Utiliser la limite par défaut si le paramètre `limit` n'est pas défini ou invalide
        if (!limit || isNaN(parseInt(limit)) || parseInt(limit) < 1) {
            limit = defaultLimit.toString();
        }

        // Récupérer les role filtrés par date de création avec la limite appliquée
        const filteredRole = await Setting.aggregate([
            { $unwind: "$role" }, // Dérouler le tableau de role
            { $match: { "role.date_creation": { $exists: true, $ne: null } } }, // Filtrer les role ayant une date de création définie
            { $sort: { "role.date_creation": -1 } }, // Trier les role par date de création (du plus récent au plus ancien)
            { $limit: parseInt(limit) } // Appliquer la limite
        ]);

        // Extraire uniquement les champs nécessaires des role
        const formattedRole = filteredRole.map(doc => doc.role);

        // Nombre total d'éléments dans la base de données (à récupérer)
        const totalCount = await Setting.aggregate([
            { $unwind: "$role" }, // Dérouler le tableau de role
            { $match: { "role.date_creation": { $exists: true, $ne: null } } }, // Filtrer les role ayant une date de création définie
            { $count: "total" } // Compter le nombre total d'éléments
        ]);

        // Récupérer le nombre total d'éléments (s'il existe)
        const total = totalCount.length > 0 ? totalCount[0].total : 0;

        // Envoyer la réponse avec les données et les informations sur le nombre d'éléments
        res.json({
            success: true,
            count: formattedRole.length, // Nombre d'éléments retournés
            totalCount: total, // Nombre total d'éléments dans la base de données
            data: formattedRole,
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
export const updateRole = async (req, res) => {
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

        // Rechercher le role correspondant dans la collection Setting
        const role = await Setting.aggregate([
            { $unwind: "$roles" }, // Dérouler le tableau de role
            { $match: { "roles._id": new mongoose.Types.ObjectId(id) } }, // Filtrer le role par son ID
            { $project: { role: 1 } } // Projeter uniquement le role
        ]);

        // Vérifier si le role existe
        if (role.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        const existingRole = role[0].role;

        // Vérifier si les données existantes sont identiques aux nouvelles données
        if (existingRole.code === code && existingRole.libelleFr === libelleFr && existingRole.libelleEn === libelleEn) {
            return res.json({
                success: true,
                message: message.donne_a_jour,
                data: existingRole,
            });
        }

        //vérifier si le code existe déjà or mis le code de l'élément en cours de modification
        if (existingRole.code !== code) {
            const existingCode = await Setting.findOne({ 'roles.code': code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        //vérifier si le libelle fr existe déjà or mis le libelle fr de l'élément en cours de modification
        if (existingRole.libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({ 'roles.libelleFr': libelleFr });
            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }
        //vérifier si le libelle en existe déjà or mis le libelle en de l'élément en cours de modification
        if (existingRole.libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({ 'roles.libelleEn': libelleEn });
            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        const updatedRole = { ...existingRole };

        // Mettre à jour les champs modifiés
        updatedRole.code = code;
        updatedRole.libelleFr = libelleFr;
        updatedRole.libelleEn = libelleEn;

        // Mettre à jour le role dans la base de données
        await Setting.updateOne(
            { "roles._id": new mongoose.Types.ObjectId(id) }, // Trouver le role par son ID
            { $set: { "roles.$": updatedRole } } // Mettre à jour le role
        );

        // Envoyer la réponse avec les données mises à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedRole,
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
export const deleteRole = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate({}, { $pull: { roles: { _id: new mongoose.Types.ObjectId(id) } } }, { new: true });

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


