import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createSection = async (req, res) => {
    // const { code, libelle, id_departement } = req.body;
    const { code, libelleFr, libelleEn, departement } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!libelleFr || !libelleEn || !departement) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        if (!mongoose.Types.ObjectId.isValid(departement)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si la departement existe
        const existingDepartement = await Setting.findOne({
            'departementsAcademique._id': departement
        });

        if (!existingDepartement) {
            return res.status(400).json({
                success: false,
                message: message.departement_manquante,
            });
        }

        // Vérifier si le code du section existe déjà
        if(code){
            const existingCode = await Setting.findOne({
                sections: {
                    $elemMatch: {
                        code: code,
                        departement: departement // Assurez-vous d'avoir l'ID de la departement à vérifier
                    }
                }
            });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code,
                });
            }
        }
        // Vérifier si le libelle fr du section existe déjà
        const existingLibelleFr = await Setting.findOne({
            sections: {
                $elemMatch: {
                    libelleFr: libelleFr,
                    departement: departement // Assurez-vous d'avoir l'ID de la departement à vérifier
                }
            }
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en du section existe déjà
        const existingLibelleEn = await Setting.findOne({
            sections: {
                $elemMatch: {
                    libelleEn: libelleEn,
                    departement: departement // Assurez-vous d'avoir l'ID de la departement à vérifier
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

        // Créer un nouveau section
        const newsection = { code, libelleFr, libelleEn, departement, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        let data;
        if (!setting) {
            // Créer la collection et le document
            data = await Setting.create({ sections: [newsection] });
        } else {
            // Mettre à jour le document existant
            data = await Setting.findOneAndUpdate({}, { $push: { sections: newsection } }, { new: true });
        }

        // Retourner uniquement l'objet ajouté
        const createdsection = data.sections.find((section) => section.libelleFr === libelleFr && section.departement.toString() === departement);
        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: createdsection,
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
export const updateSection = async (req, res) => {
    const { sectionId } = req.params;
    const { code, libelleFr, libelleEn, departement } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!libelleFr || !libelleEn || !departement) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }
        // Vérifier si sectionId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(sectionId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si la departement existe
        const existingDepartement = await Setting.findOne({
            'departementsAcademique._id': departement
            
        });

        if (!existingDepartement) {
            return res.status(400).json({
                success: false,
                message: message.departement_academique_invalide,
            });
        }

        // Trouver le section en cours de modification
        const existingSection = await Setting.findOne(
            { "sections._id": sectionId },
            { "sections.$": 1 }//récupéré uniquement l'élément de la recherche
        );
        
        if (!existingSection) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Vérifier si le code existe déjà, à l'exception du section en cours de modification
        if (code && existingSection.sections[0].code !== code) {
            const existingCode = await Setting.findOne({
                sections: {
                    $elemMatch: {
                        code: code,
                        departement: departement // Assurez-vous d'avoir l'ID de la departement à vérifier
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
        // Vérifier si le libelle fr existe déjà, à l'exception du section en cours de modification
        if (existingSection.sections[0].libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({
                sections: {
                    $elemMatch: {
                        libelleFr: libelleFr,
                        departement: departement // Assurez-vous d'avoir l'ID de la departement à vérifier
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

        // Vérifier si le libelle en existe déjà, à l'exception du section en cours de modification
        if (existingSection.sections[0].libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({
                sections: {
                    $elemMatch: {
                        libelleEn: libelleEn,
                        departement: departement // Assurez-vous d'avoir l'ID de la departement à vérifier
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

       
        // Mettre à jour le section dans la base de données
        const updatedsection = await Setting.findOneAndUpdate(
            { "sections._id": new mongoose.Types.ObjectId(sectionId) }, // Trouver le section par son ID
            { $set: { "sections.$.code": code, "sections.$.libelleFr": libelleFr, "sections.$.libelleEn": libelleEn, "sections.$.departement": departement, "sections.$.date_creation": DateTime.now().toJSDate() } }, // Mettre à jour le section
            { new: true, projection: { _id: 0, sections: { $elemMatch: { _id: new mongoose.Types.ObjectId(sectionId) } } } } // Renvoyer uniquement le section mis à jour
        );

        // Vérifier si le section existe
        if (!updatedsection || !updatedsection.sections || !updatedsection.sections.length) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Envoyer la réponse avec l'objet mis à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedsection.sections[0],
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
export const deleteSection = async (req, res) => {
    const { sectionId } = req.params;

    try {
        // Vérifier si sectionId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(sectionId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate(
            {},
            { $pull: { sections: { _id: new mongoose.Types.ObjectId(sectionId) } } },
            { new: true }
        );

        if (!setting || !setting.section) {
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
