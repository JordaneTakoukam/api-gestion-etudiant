import { message } from "../../configs/message.js";
import Batiment from "../../models/batiment.model.js";
import mongoose from "mongoose";

export const deleteBatiment = async (req, res) => {
    const { batimentId } = req.params;

    // Vérifier si batimentId est un bon id mongoose
    if (!mongoose.Types.ObjectId.isValid(batimentId)) {
        return res.status(400).json({ success: false, message: "L'identifiant du bâtiment est invalide." });
    }

    try {
        const deletedBatiment = await Batiment.findByIdAndDelete(batimentId);

        if (!deletedBatiment) {
            return res.status(404).json({ success: false, message: "Aucun bâtiment n'a été trouvé." });
        }

        res.status(200).json({
            success: true,
            message: `Bâtiment ${message.supprimerAvecSuccess}`,
        });
    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
}
