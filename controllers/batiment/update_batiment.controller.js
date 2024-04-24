import { message } from "../../configs/message.js";
import Batiment from "../../models/batiment.model.js";
import mongoose from "mongoose";


export const updateBatiment = async (req, res) => {
    const { batimentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(batimentId)) {
        return res.status(400).json({ success: false, message: "L'identifiant du bâtiment est invalide." });
    }

    try {
        const updatedBatiment = await Batiment.findByIdAndUpdate(batimentId, req.body, { new: true });

        if (!updatedBatiment) {
            return res.status(404).json({ success: false, message: "Aucun bâtiment n'a pas été trouvé." });
        }

        res.status(200).json({
            success: true,
            data: updatedBatiment,
            message: `Bâtiment ${message.modifierAvecSuccess}`,
        });
    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
}