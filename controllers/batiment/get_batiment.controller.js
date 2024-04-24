import { message } from "../../configs/message.js";
import Batiment from "../../models/batiment.model.js";


export const getById = async (req, res) => {
    const { batimentId } = req.params;

    try {
        const batiment = await Batiment.findById(batimentId);

        if (!batiment) {
            return res.status(404).json({ success: false, message: "Aucun bâtiment n'a pas été trouvé." });
        }

        res.status(200).json({
            success: true,
            data: batiment,
        });
    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
}



//
export const getAllBatiment = async (req, res) => {
    try {
        const batiments = await Batiment.find();

        res.status(200).json({
            success: true,
            data: batiments,
        });
    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
}