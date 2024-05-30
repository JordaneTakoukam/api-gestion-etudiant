import Setting from '../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';



// create
export const createPromotion = async (req, res) => {
    const { annee, code, libelleFr, libelleEn } = req.body;

    try {
        if (!annee || !libelleFr || !libelleEn) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }
        // Vérifier si le code de la région existe déjà
        if(code){
            const existingCode = await Setting.findOne({
                'promotions.code': code,
            });
            
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code,
                });
            }
        }
        // Vérifier si le libelle fr de la région existe déjà
        const existingLibelleFr = await Setting.findOne({
            'promotions.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en de la région existe déjà
        const existingLibelleEn = await Setting.findOne({
            'promotions.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer une nouvelle région
        const newPromotion = { code, libelleFr, libelleEn, annee, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        let data;
        if (!setting) {
            // Créer la collection et le document
            data = await Setting.create({ promotions: [newPromotion] });
        } else {
            // Mettre à jour le document existant
            data = await Setting.findOneAndUpdate({}, { $push: { promotions: newPromotion } }, { new: true });
        }

        // Retourner uniquement l'objet ajouté
        const createdPromotion = data.promotions.find((promotion) => promotion.code === code);

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: createdPromotion,
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
export const updatePromotion = async (req, res) => {
    const { promotionId } = req.params;
    const { code, libelleFr, libelleEn, annee } = req.body;

    try {
        if (!annee || !libelleFr || !libelleEn) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérifier si promotionId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(promotionId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Trouver la région en cours de modification
        const existingPromotion = await Setting.findOne(
            { "promotions._id": promotionId },
            { "promotions.$": 1 }//récupéré uniquement l'élément de la recherche
        );
        
        if (!existingPromotion) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Vérifier si le code existe déjà, à l'exception de la région en cours de modification
        if (code && existingPromotion.promotions[0].code !== code) {
            const existingCode = await Setting.findOne({
                'promotions.code': code,
            });

            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        // Vérifier si le libelle fr existe déjà, à l'exception de la région en cours de modification
        if (existingPromotion.promotions[0].libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({
                'promotions.libelleFr': libelleFr,
            });

            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }

        // Vérifier si le libelle en existe déjà, à l'exception de la région en cours de modification
        if (existingPromotion.promotions[0].libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({
                'promotions.libelleEn': libelleEn,
            });

            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        // Mettre à jour la région dans la base de données
        const updatedPromotion = await Setting.findOneAndUpdate(
            { "promotions._id": new mongoose.Types.ObjectId(promotionId) }, // Trouver la région par son ID
            { $set: { "promotions.$.code": code, "promotions.$.libelleFr": libelleFr, "promotions.$.libelleEn": libelleEn, "promotions.$.annee": annee, "promotions.$.date_creation": DateTime.now().toJSDate() } }, // Mettre à jour la région
            { new: true, projection: { _id: 0, promotions: { $elemMatch: { _id: new mongoose.Types.ObjectId(promotionId) } } } } // Renvoyer uniquement la région mise à jour
        );

        // Vérifier si la région existe
        if (!updatedPromotion || !updatedPromotion.promotions || !updatedPromotion.promotions.length) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Envoyer la réponse avec l'objet mis à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedPromotion.promotions[0],
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
export const deletePromotion = async (req, res) => {
    const { promotionId } = req.params;

    try {
        // Vérifier si promotionId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(promotionId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate(
            {},
            { $pull: { promotions: { _id: new mongoose.Types.ObjectId(promotionId) } } },
            { new: true }
        );

        if (!setting || !setting.promotions) {
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
