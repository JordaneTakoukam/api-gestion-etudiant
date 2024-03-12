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

        res.status(200).json({
            success: true,
            settings: settings
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur, 
        });
    }
};
