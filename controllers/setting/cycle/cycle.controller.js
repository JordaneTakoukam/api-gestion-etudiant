import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createCycle = async (req, res) => {
    // const { code, libelle, id_section } = req.body;
    const { code, libelleFr, libelleEn, section } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !section) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        if (!mongoose.Types.ObjectId.isValid(section)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si la section existe
        const existingSection = await Setting.findOne({
            'sections._id': section
        });

        if (!existingSection) {
            return res.status(400).json({
                success: false,
                message: message.section_manquante,
            });
        }

        // Vérifier si le code du cycle existe déjà
        const existingCode = await Setting.findOne({
            cycles: {
                $elemMatch: {
                    code: code,
                    section: section // Assurez-vous d'avoir l'ID de la section à vérifier
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
            cycles: {
                $elemMatch: {
                    libelleFr: libelleFr,
                    section: section // Assurez-vous d'avoir l'ID de la section à vérifier
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
            cycles: {
                $elemMatch: {
                    libelleEn: libelleEn,
                    section: section // Assurez-vous d'avoir l'ID de la section à vérifier
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

        // Créer un nouveau cycle
        const newCycle = { code, libelleFr, libelleEn, section, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        let data;
        if (!setting) {
            // Créer la collection et le document
            data = await Setting.create({ cycles: [newCycle] });
        } else {
            // Mettre à jour le document existant
            data = await Setting.findOneAndUpdate({}, { $push: { cycles: newCycle } }, { new: true });
        }

        // Retourner uniquement l'objet ajouté
        const createdCycle = data.cycles.find((cycle) => cycle.code === code && cycle.section.toString() === section);
        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: createdCycle,
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
export const updateCycle = async (req, res) => {
    const { cycleId } = req.params;
    const { code, libelleFr, libelleEn, section } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !section) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }
        // Vérifier si cycleId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(cycleId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si la section existe
        const existingSection = await Setting.findOne({
            'sections._id': section
            
        });

        if (!existingSection) {
            return res.status(400).json({
                success: false,
                message: message.section_invalide,
            });
        }

         // Trouver le cycle en cours de modification
         const existingCycle = await Setting.findOne(
            { "cycles._id": cycleId },
            { "cycles.$": 1 }//récupéré uniquement l'élément de la recherche
        );
        
        if (!existingCycle) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Vérifier si le code existe déjà, à l'exception du cycle en cours de modification
        if (existingCycle.cycles[0].code !== code) {
            const existingCode = await Setting.findOne({
                cycles: {
                    $elemMatch: {
                        code: code,
                        section: section // Assurez-vous d'avoir l'ID de la section à vérifier
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
        // Vérifier si le libelle fr existe déjà, à l'exception du cycle en cours de modification
        if (existingCycle.cycles[0].libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({
                cycles: {
                    $elemMatch: {
                        libelleFr: libelleFr,
                        section: section // Assurez-vous d'avoir l'ID de la section à vérifier
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

        // Vérifier si le libelle en existe déjà, à l'exception du cycle en cours de modification
        if (existingCycle.cycles[0].libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({
                cycles: {
                    $elemMatch: {
                        libelleEn: libelleEn,
                        section: section // Assurez-vous d'avoir l'ID de la section à vérifier
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

       
        // Mettre à jour le cycle dans la base de données
        const updatedCycle = await Setting.findOneAndUpdate(
            { "cycles._id": new mongoose.Types.ObjectId(cycleId) }, // Trouver le cycle par son ID
            { $set: { "cycles.$.code": code, "cycles.$.libelleFr": libelleFr, "cycles.$.libelleEn": libelleEn, "cycles.$.section": section, "cycles.$.date_creation": DateTime.now().toJSDate() } }, // Mettre à jour le cycle
            { new: true, projection: { _id: 0, cycles: { $elemMatch: { _id: new mongoose.Types.ObjectId(cycleId) } } } } // Renvoyer uniquement le cycle mis à jour
        );

        // Vérifier si le cycle existe
        if (!updatedCycle || !updatedCycle.cycles || !updatedCycle.cycles.length) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Envoyer la réponse avec l'objet mis à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedCycle.cycles[0],
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
export const deleteCycle = async (req, res) => {
    const { cycleId } = req.params;

    try {
        // Vérifier si cycleId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(cycleId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate(
            {},
            { $pull: { cycles: { _id: new mongoose.Types.ObjectId(cycleId) } } },
            { new: true }
        );

        if (!setting || !setting.cycle) {
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
