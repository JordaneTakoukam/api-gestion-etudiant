import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createCommune = async (req, res) => {
    // const { code, libelle, id_departement } = req.body;
    const { code, libelleFr, libelleEn, departement } = req.body;
    try {
        // Vérifier si l'ID de département est valide
        // if (!mongoose.Types.ObjectId.isValid(id_departement)) {
        if (!mongoose.Types.ObjectId.isValid(departement._id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si le département existe
        const existingDepartement = await Setting.findOne({
            // 'departement._id': id_departement
            'departement._id': departement._id
        });

        if (!existingDepartement) {
            return res.status(400).json({
                success: false,
                message: message.departement_inexistant,
            });
        }

        // Vérifier si le code de la commune existe déjà
        const existingCode = await Setting.findOne({
            'region.code': code,
        });
        
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code,
            });
        }
        // Vérifier si le libelle fr de la commune existe déjà
        const existingLibelleFr = await Setting.findOne({
            'region.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en de la commune existe déjà
        const existingLibelleEn = await Setting.findOne({
            'region.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer une nouvelle commune
        const newCommune = { code, libelleFr, libelleEn, departement, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        let data;
        if (!setting) {
            // Créer la collection et le document
            data = await Setting.create({ communes: [newCommune] });
        } else {
            // Mettre à jour le document existant
            data = await Setting.findOneAndUpdate({}, { $push: { communes: newCommune } }, { new: true });
        }

        // Retourner uniquement l'objet ajouté
        const createdCommune = data.communes.find((commune) => commune.code === code);

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: createdCommune,
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};

// update
export const updateCommune = async (req, res) => {
    const { communeId } = req.params;
    const { code, libelleFr, libelleEn, departement } = req.body;

    try {
        // Vérifier si communeId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(communeId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si le département existe
        const existingDepartement = await Setting.findOne({
            'departement._id': departement._id
        });

        if (!existingDepartement) {
            return res.status(400).json({
                success: false,
                message: message.departement_inexistant,
            });
        }

        // Vérifier si le code de la commune existe déjà
        const existingCode = await Setting.findOne({
            'region.code': code,
        });
        
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code,
            });
        }
        // Vérifier si le libelle fr de la commune existe déjà
        const existingLibelleFr = await Setting.findOne({
            'region.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en de la commune existe déjà
        const existingLibelleEn = await Setting.findOne({
            'region.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        // Mettre à jour la commune dans la base de données
        const updatedCommune = await Setting.findOneAndUpdate(
            { "communes._id": new mongoose.Types.ObjectId(communeId) }, // Trouver la commune par son ID
            { $set: { "communes.$.code": code, "communes.$.libelleFr": libelleFr, "communes.$.libelleEn": libelleEn, "communes.$.departement": departement, "communes.$.date_creation": DateTime.now().toJSDate() } }, // Mettre à jour la commune
            { new: true, projection: { _id: 0, communes: { $elemMatch: { _id: new mongoose.Types.ObjectId(communeId) } } } } // Renvoyer uniquement la commune mise à jour
        );

        // Vérifier si la commune existe
        if (!updatedCommune || !updatedCommune.communes || !updatedCommune.communes.length) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Envoyer la réponse avec l'objet mis à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedCommune.communes[0],
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        return res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};

// delete
export const deleteCommune = async (req, res) => {
    const { communeId } = req.params;

    try {
        // Vérifier si communeId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(communeId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate(
            {},
            { $pull: { communes: { _id: new mongoose.Types.ObjectId(communeId) } } },
            { new: true }
        );

        if (!setting || !setting.communes) {
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
};
