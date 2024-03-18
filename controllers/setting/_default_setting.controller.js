import { message } from '../../configs/message.js';
import Setting from './../../models/setting.model.js';

// get alls settings
export const getSettings = async (_, res) => {
    try {
        let settings = await Setting.find();

        // Vérifie s'il n'y a aucun document dans la collection
        if (settings.length === 0) {
            // Crée un nouveau document avec des tableaux vides pour chaque champ
            const newSetting = new Setting();
            settings = await newSetting.save();
        }

        // Accéder au premier élément du tableau
        settings = settings[0];

        res.status(200).json({
            success: true,
            settings: settings,
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};


// Supprime tous les documents de la collection "Setting"
export const deleteAllSettings = async (req, res) => {
    try {
        await Setting.deleteMany({}); // Supprime tous les documents

        res.status(200).json({
            success: true,
            message: "Tous les paramètres ont été supprimés avec succès."
        });
    } catch (error) {
        console.error("Erreur lors de la suppression des paramètres :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};
