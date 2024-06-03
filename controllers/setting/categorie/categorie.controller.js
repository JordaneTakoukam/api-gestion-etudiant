import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createCategorie = async (req, res) => {
    // const { code, libelle, id_grade } = req.body;
    const { code, libelleFr, libelleEn, grade } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!libelleFr || !libelleEn || !grade) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        if (!mongoose.Types.ObjectId.isValid(grade)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si la grade existe
        const existingGrade = await Setting.findOne({
            'grades._id': grade
        });

        if (!existingGrade) {
            return res.status(400).json({
                success: false,
                message: message.grade_invalide,
            });
        }

        // Vérifier si le code de la categorie existe déjà
        if(code){
            const existingCode = await Setting.findOne({
                categories: {
                    $elemMatch: {
                        code: code,
                        grade: grade // Assurez-vous d'avoir l'ID de la grade à vérifier
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
        // Vérifier si le libelle fr du categorie existe déjà
        const existingLibelleFr = await Setting.findOne({
            categories: {
                $elemMatch: {
                    libelleFr: libelleFr,
                    grade: grade // Assurez-vous d'avoir l'ID de la grade à vérifier
                }
            }
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en du categorie existe déjà
        const existingLibelleEn = await Setting.findOne({
            categories: {
                $elemMatch: {
                    libelleEn: libelleEn,
                    grade: grade // Assurez-vous d'avoir l'ID de la grade à vérifier
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

        // Créer un nouveau categorie
        const newcategorie = { code, libelleFr, libelleEn, grade, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        let data;
        if (!setting) {
            // Créer la collection et le document
            data = await Setting.create({ categories: [newcategorie] });
        } else {
            // Mettre à jour le document existant
            data = await Setting.findOneAndUpdate({}, { $push: { categories: newcategorie } }, { new: true });
        }

        // Retourner uniquement l'objet ajouté
        const createdcategorie = data.categories.find((categorie) => categorie.libelleFr === libelleFr && categorie.grade.toString() === grade);
        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: createdcategorie,
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
export const updateCategorie = async (req, res) => {
    const { id } = req.params;
    const { code, libelleFr, libelleEn, grade } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!libelleFr || !libelleEn || !grade) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si la grade existe
        const existingGrade = await Setting.findOne({
            'grades._id': grade
            
        });

        if (!existingGrade) {
            return res.status(400).json({
                success: false,
                message: message.grade_academique_invalide,
            });
        }

        // Trouver le categorie en cours de modification
        const existingCategorie = await Setting.findOne(
            { "categories._id": id },
            { "categories.$": 1 }//récupéré uniquement l'élément de la recherche
        );
        
        if (!existingCategorie) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Vérifier si le code existe déjà, à l'exception du categorie en cours de modification
        if (code && existingCategorie.categories[0].code !== code) {
            const existingCode = await Setting.findOne({
                categories: {
                    $elemMatch: {
                        code: code,
                        grade: grade // Assurez-vous d'avoir l'ID de la grade à vérifier
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
        // Vérifier si le libelle fr existe déjà, à l'exception du categorie en cours de modification
        if (existingCategorie.categories[0].libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({
                categories: {
                    $elemMatch: {
                        libelleFr: libelleFr,
                        grade: grade // Assurez-vous d'avoir l'ID de la grade à vérifier
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

        // Vérifier si le libelle en existe déjà, à l'exception du categorie en cours de modification
        if (existingCategorie.categories[0].libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({
                categories: {
                    $elemMatch: {
                        libelleEn: libelleEn,
                        grade: grade // Assurez-vous d'avoir l'ID de la grade à vérifier
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

       
        // Mettre à jour le categorie dans la base de données
        const updatedcategorie = await Setting.findOneAndUpdate(
            { "categories._id": new mongoose.Types.ObjectId(id) }, // Trouver le categorie par son ID
            { $set: { "categories.$.code": code, "categories.$.libelleFr": libelleFr, "categories.$.libelleEn": libelleEn, "categories.$.grade": grade, "categories.$.date_creation": DateTime.now().toJSDate() } }, // Mettre à jour le categorie
            { new: true, projection: { _id: 0, categories: { $elemMatch: { _id: new mongoose.Types.ObjectId(id) } } } } // Renvoyer uniquement le categorie mis à jour
        );

        // Vérifier si le categorie existe
        if (!updatedcategorie || !updatedcategorie.categories || !updatedcategorie.categories.length) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Envoyer la réponse avec l'objet mis à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedcategorie.categories[0],
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
export const deleteCategorie = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifier si id est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate(
            {},
            { $pull: { categories: { _id: new mongoose.Types.ObjectId(id) } } },
            { new: true }
        );

        if (!setting || !setting.categorie) {
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
