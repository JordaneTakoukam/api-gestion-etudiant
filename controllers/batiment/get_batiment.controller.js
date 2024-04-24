import { message } from "../../configs/message.js";
import Batiment from "../../models/batiment.model.js";


export const getBatimentById = async (req, res) => {
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
    const { page = 1, pageSize = 10 } = req.query;

    const startIndex = (page - 1) * pageSize;

    try {
        const batiments = await Batiment.find().skip(startIndex).limit(parseInt(pageSize));

        const totalBatiment = await Batiment.countDocuments();
        const totalPages = Math.ceil(totalBatiment / parseInt(pageSize));


        res.status(200).json({
            success: true,
            data: {
                listData: batiments,
                totalPages: totalPages,
                currentPage: page,
                totalItems: totalBatiment,
                pageSize: pageSize
            }
        });
    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
}