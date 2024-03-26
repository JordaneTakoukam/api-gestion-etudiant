import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createDepartement = async (req, res) => {
    // const { code, libelle, id_region } = req.body;
    const { code, libelleFr, libelleEn, region } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !region) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }
        if (!mongoose.Types.ObjectId.isValid(region._id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si la région existe
        const existingRegion = await Setting.findOne({
            'region._id': region
        });

        if (!existingRegion) {
            return res.status(400).json({
                success: false,
                message: message.region_inexistante,
            });
        }


        // Vérifier si le code de la département existe déjà
        const existingCode = await Setting.findOne({
            'departement.code': code,
        });
        
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code,
            });
        }
        // Vérifier si le libelle fr de la département existe déjà
        const existingLibelleFr = await Setting.findOne({
            'departement.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en de la département existe déjà
        const existingLibelleEn = await Setting.findOne({
            'departement.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouveau département
        const newDepartement = { code, libelleFr, libelleEn, region, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        let data;
        if (!setting) {
            // Créer la collection et le document
            data = await Setting.create({ departement: [newDepartement] });
        } else {
            // Mettre à jour le document existant
            data = await Setting.findOneAndUpdate({}, { $push: { departement: newDepartement } }, { new: true });
        }

        // Retourner uniquement l'objet ajouté
        const createdDepartement = data.departement.find((departement) => departement.code === code);

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: createdDepartement,
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
export const updateDepartement = async (req, res) => {
    const { departementId } = req.params;
    const { code, libelleFr, libelleEn, region } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !region) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }
        // Vérifier si departementId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(departementId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si la région existe
        const existingRegion = await Setting.findOne({
            'region._id': region
            
        });

        if (!existingRegion) {
            return res.status(400).json({
                success: false,
                message: message.region_inexistante,
            });
        }

        // Trouver le département en cours de modification
        const existingDepartement = await Setting.findOne(
            { "departement._id": departementId },
            { "departement.$": 1 }//récupéré uniquement l'élément de la recherche
        );
        
        if (!existingDepartement) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Vérifier si le code existe déjà, à l'exception du département en cours de modification
        if (existingDepartement.departement[0].code !== code) {
            const existingCode = await Setting.findOne({
                'departement.code': code,
            });

            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        // Vérifier si le libelle fr existe déjà, à l'exception du département en cours de modification
        if (existingDepartement.departement[0].libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({
                'departement.libelleFr': libelleFr,
            });

            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }

        // Vérifier si le libelle en existe déjà, à l'exception du département en cours de modification
        if (existingDepartement.departement[0].libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({
                'departement.libelleEn': libelleEn,
            });

            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        
        

        // Mettre à jour le département dans la base de données
        const updatedDepartement = await Setting.findOneAndUpdate(
            { "departement._id": new mongoose.Types.ObjectId(departementId) }, // Trouver le département par son ID
            { $set: { "departement.$.code": code, "departement.$.libelleFr": libelleFr, "departement.$.libelleEn": libelleEn, "departement.$.region": region, "departement.$.date_creation": DateTime.now().toJSDate() } }, // Mettre à jour le département
            { new: true, projection: { _id: 0, departement: { $elemMatch: { _id: new mongoose.Types.ObjectId(departementId) } } } } // Renvoyer uniquement le département mis à jour
        );

        // Vérifier si le département existe
        if (!updatedDepartement || !updatedDepartement.departement || !updatedDepartement.departement.length) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Envoyer la réponse avec l'objet mis à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedDepartement.departement[0],
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
export const deleteDepartement = async (req, res) => {
    const { departementId } = req.params;

    try {
        // Vérifier si departementId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(departementId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate(
            {},
            { $pull: { departement: { _id: new mongoose.Types.ObjectId(departementId) } } },
            { new: true }
        );

        if (!setting || !setting.departement) {
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
