import { message } from "../../configs/message.js";
import Batiment from "../../models/batiment.model.js";

export const createBatiment = async (req, res) => {
    try {
        // Extrayez les données nécessaires du corps de la requête
        const { devise, nom, localisation, type, extras, images, locaux } = req.body;

        // Vérifiez si les champs requis sont présents
        if (!devise || !devise.code || !devise.label || !nom || !localisation || !localisation.pays || !localisation.ville || !type) {
            return res.status(400).json({ success: false, message: "Les champs requis ne peuvent pas être vides." });
        }

        // Vérifiez si un bâtiment avec le même nom existe déjà
        const existingBatiment = await Batiment.findOne({ nom });

        if (existingBatiment) {
            return res.status(400).json({ success: false, message: "Un bâtiment avec ce nom existe déjà." });
        }

        // Créez une nouvelle instance de Batiment avec les données fournies
        const newBatiment = new Batiment({
            devise,
            nom,
            localisation,
            type,
            extras,
            images,
            locaux
        });

        // Enregistrez le nouveau bâtiment dans la base de données
        const batiment = await newBatiment.save();

        res.status(200).json({
            success: true,
            data: batiment,
            message: `Bâtiment ${message.ajouterAvecSuccess}`,
        });
    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
}
