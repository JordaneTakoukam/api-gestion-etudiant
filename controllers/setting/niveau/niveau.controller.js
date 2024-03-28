import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createNiveau = async (req, res) => {
    // const { code, libelle, id_cycle } = req.body;
    const { code, libelleFr, libelleEn, cycle } = req.body;

    try {

        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !cycle) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        if (!mongoose.Types.ObjectId.isValid(cycle)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si le cycle existe
        const existingCycle = await Setting.findOne({
            'cycle._id': cycle
        });

        if (!existingCycle) {
            return res.status(400).json({
                success: false,
                message: message.cycle_inexistante,
            });
        }


        // Vérifier si le code du niveau existe déjà
        const existingCode = await Setting.findOne({
            niveau: {
                $elemMatch: {
                    code: code,
                    cycle: cycle // Assurez-vous d'avoir l'ID du cycle à vérifier
                }
            }
        });
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code,
            });
        }
        // Vérifier si le libelle fr du cycle existe déjà
        const existingLibelleFr = await Setting.findOne({
            niveau: {
                $elemMatch: {
                    libelleFr: libelleFr,
                    cycle: cycle // Assurez-vous d'avoir l'ID du cycle à vérifier
                }
            }
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en du cycle existe déjà
        const existingLibelleEn = await Setting.findOne({
            niveau: {
                $elemMatch: {
                    libelleEn: libelleEn,
                    cycle: cycle // Assurez-vous d'avoir l'ID du cycle à vérifier
                }
            }
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer un nouveau niveau
        const newNiveau = { code, libelleFr, libelleEn, cycle, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        let data;
        if (!setting) {
            // Créer la collection et le document
            data = await Setting.create({ niveau: [newNiveau] });
        } else {
            // Mettre à jour le document existant
            data = await Setting.findOneAndUpdate({}, { $push: { niveau: newNiveau } }, { new: true });
        }

        // Retourner uniquement l'objet ajouté
        const createdNiveau = data.niveau.find((niveau) => niveau.code === code && niveau.cycle.toString() === cycle);

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: createdNiveau,
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
export const updateNiveau = async (req, res) => {
    const { niveauId } = req.params;
    const { code, libelleFr, libelleEn, cycle } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !cycle) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérifier si niveauId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si la cycle existe
        const existingCycle = await Setting.findOne({
            'cycle._id': cycle
            
        });

        if (!existingCycle) {
            return res.status(400).json({
                success: false,
                message: message.cycle_inexistante,
            });
        }

         // Trouver le niveau en cours de modification
         const existingNiveau = await Setting.findOne(
            { "niveau._id": niveauId },
            { "niveau.$": 1 }//récupéré uniquement l'élément de la recherche
        );
        
        if (!existingNiveau) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Vérifier si le code existe déjà, à l'exception du niveau en cours de modification
        if (existingNiveau.niveau[0].code !== code) {
            const existingCode = await Setting.findOne({
                niveau: {
                    $elemMatch: {
                        code: code,
                        cycle: cycle // Assurez-vous d'avoir l'ID du cycle à vérifier
                    }
                }
            });

            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        // Vérifier si le libelle fr existe déjà, à l'exception du niveau en cours de modification
        if (existingNiveau.niveau[0].libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({
                niveau: {
                    $elemMatch: {
                        libelleFr: libelleFr,
                        cycle: cycle // Assurez-vous d'avoir l'ID du cycle à vérifier
                    }
                }
            });

            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }

        // Vérifier si le libelle en existe déjà, à l'exception du niveau en cours de modification
        if (existingNiveau.niveau[0].libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({
                niveau: {
                    $elemMatch: {
                        libelleEn: libelleEn,
                        cycle: cycle // Assurez-vous d'avoir l'ID du cycle à vérifier
                    }
                }
            });

            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }

        // Mettre à jour le niveau dans la base de données
        const updatedNiveau = await Setting.findOneAndUpdate(
            { "niveau._id": new mongoose.Types.ObjectId(niveauId) }, // Trouver le niveau par son ID
            { $set: { "niveau.$.code": code, "niveau.$.libelleFr": libelleFr, "niveau.$.libelleEn": libelleEn, "niveau.$.cycle": cycle, "niveau.$.date_creation": DateTime.now().toJSDate() } }, // Mettre à jour le niveau
            { new: true, projection: { _id: 0, niveau: { $elemMatch: { _id: new mongoose.Types.ObjectId(niveauId) } } } } // Renvoyer uniquement le niveau mis à jour
        );

        // Vérifier si le niveau existe
        if (!updatedNiveau || !updatedNiveau.niveau || !updatedNiveau.niveau.length) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Envoyer la réponse avec l'objet mis à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedNiveau.niveau[0],
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
export const deleteNiveau = async (req, res) => {
    const { niveauId } = req.params;

    try {
        // Vérifier si niveauId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate(
            {},
            { $pull: { niveau: { _id: new mongoose.Types.ObjectId(niveauId) } } },
            { new: true }
        );

        if (!setting || !setting.niveau) {
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
