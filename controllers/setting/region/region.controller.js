import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';



// create
export const createRegion = async (req, res) => {
    const { code, libelle } = req.body;

    try {
        // Vérifier si la région existe déjà
        const existingRegion = await Setting.findOne({
            'region.code': code,
            'region.libelle': libelle,
        });

        if (existingRegion) {
            return res.status(400).json({
                success: false,
                message: message.existe_deja,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer une nouvelle région
        const newRegion = { code, libelle, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        let data;
        if (!setting) {
            // Créer la collection et le document
            data = await Setting.create({ region: [newRegion] });
        } else {
            // Mettre à jour le document existant
            data = await Setting.findOneAndUpdate({}, { $push: { region: newRegion } }, { new: true });
        }

        // Retourner uniquement l'objet ajouté
        const createdRegion = data.region.find((region) => region.code === code && region.libelle === libelle);

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: createdRegion,
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
//
// update
export const updateRegion = async (req, res) => {
    const { regionId } = req.params;
    const { code, libelle } = req.body;

    try {
        // Vérifier si regionId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(regionId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Mettre à jour la région dans la base de données
        const updatedRegion = await Setting.findOneAndUpdate(
            { "region._id": new mongoose.Types.ObjectId(regionId) }, // Trouver la région par son ID
            { $set: { "region.$.code": code, "region.$.libelle": libelle, "region.$.date_creation": DateTime.now().toJSDate() } }, // Mettre à jour la région
            { new: true, projection: { _id: 0, region: { $elemMatch: { _id: new mongoose.Types.ObjectId(regionId) } } } } // Renvoyer uniquement la région mise à jour
        );

        // Vérifier si la région existe
        if (!updatedRegion || !updatedRegion.region || !updatedRegion.region.length) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Envoyer la réponse avec l'objet mis à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedRegion.region[0],
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        return res.status(500).json({
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

// delete
export const deleteRegion = async (req, res) => {
    const { regionId } = req.params;

    try {
        // Vérifier si regionId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(regionId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate(
            {},
            { $pull: { region: { _id: new mongoose.Types.ObjectId(regionId) } } },
            { new: true }
        );

        if (!setting || !setting.region) {
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
