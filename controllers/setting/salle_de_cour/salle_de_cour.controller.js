import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';
import { verifierEntier } from '../../../fonctions/fonctions.js';



// create
export const createSalleDeCours = async (req, res) => {
    const { code, libelleFr, libelleEn, nbPlace} = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!libelleFr || !libelleEn || !nbPlace) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérifier si le code de la salle de cours existe déjà
        if(code){
            const existingCode = await Setting.findOne({
                'sallesDeCours.code': code,
            });
            
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code,
                });
            }
        }
        // Vérifier si le libelle fr de la salle de cours existe déjà
        const existingLibelleFr = await Setting.findOne({
            'sallesDeCours.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en de la salle de cours existe déjà
        const existingLibelleEn = await Setting.findOne({
            'sallesDeCours.libelleEn': libelleEn,
        });

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        //Vérifier si le nombre de place est un entier
        const isInteger = Number.isInteger(nbPlace);
        if (!isInteger) {
            return res.status(400).json({
                success: false,
                message: message.nombre_entier
            });
        } 


        const date_creation = DateTime.now().toJSDate();

        // Créer une nouvelle salle de cours
        const newSalleDeCours = { code, libelleFr, libelleEn, nbPlace, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        let data;
        if (!setting) {
            // Créer la collection et le document
            data = await Setting.create({ sallesDeCours: [newSalleDeCours] });
        } else {
            // Mettre à jour le document existant
            data = await Setting.findOneAndUpdate({}, { $push: { sallesDeCours: newSalleDeCours } }, { new: true });
        }

        // Retourner uniquement l'objet ajouté
        const createdSalleDeCours = data.sallesDeCours.find((salleDeCours) => salleDeCours.libelleFr === libelleFr);

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: createdSalleDeCours,
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
export const updateSalleDeCours = async (req, res) => {
    const { salleDeCoursId } = req.params;
    const { code, libelleFr, libelleEn, nbPlace } = req.body;

    try {
        // Vérifier si tous les champs obligatoires sont présents
        if (!libelleFr || !libelleEn || !nbPlace) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }
        // Vérifier si salledecoursId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(salleDeCoursId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

         // Trouver la salle de cours en cours de modification
         const existingSalledeCours = await Setting.findOne(
            { "sallesDeCours._id": salleDeCoursId },
            { "sallesDeCours.$": 1 }//récupéré uniquement l'élément de la recherche
        );
        
        if (!existingSalledeCours) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Vérifier si le code existe déjà, à l'exception de la salle de cours en cours de modification
        if (code && existingSalledeCours.sallesDeCours[0].code !== code) {
            const existingCode = await Setting.findOne({
                'sallesDeCours.code': code,
            });

            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }
        // Vérifier si le libelle fr existe déjà, à l'exception de la salla de cours en cours de modification
        if (existingSalledeCours.sallesDeCours[0].libelleFr !== libelleFr) {
            const existingLibelleFr = await Setting.findOne({
                'sallesDeCours.libelleFr': libelleFr,
            });

            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }

        // Vérifier si le libelle en existe déjà, à l'exception de la salle de cours en cours de modification
        if (existingSalledeCours.sallesDeCours[0].libelleEn !== libelleEn) {
            const existingLibelleEn = await Setting.findOne({
                'sallesDeCours.libelleEn': libelleEn,
            });

            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }
        
        //Vérifier si le nombre de place est un entier
        const isInteger = Number.isInteger(nbPlace);
        if (!isInteger) {
            return res.status(400).json({
                success: false,
                message: message.nombre_entier
            });
            
        }
        // Mettre à jour la salle de cours dans la base de données
        const updatedSalleDeCours = await Setting.findOneAndUpdate(
            { "sallesDeCours._id": new mongoose.Types.ObjectId(salleDeCoursId) }, // Trouver la salle de cours par son ID
            { $set: { "sallesDeCours.$.code": code, "sallesDeCours.$.libelleFr": libelleFr, "sallesDeCours.$.libelleEn": libelleEn, "sallesDeCours.$.nbPlace" : nbPlace, "sallesDeCours.$.date_creation": DateTime.now().toJSDate() } }, // Mettre à jour la salle de cours
            { new: true, projection: { _id: 0, sallesDeCours: { $elemMatch: { _id: new mongoose.Types.ObjectId(salleDeCoursId) } } } } // Renvoyer uniquement la salle de cours mise à jour
        );

        // Vérifier si la salle de cours existe
        if (!updatedSalleDeCours || !updatedSalleDeCours.sallesDeCours || !updatedSalleDeCours.sallesDeCours.length) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Envoyer la réponse avec l'objet mis à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedSalleDeCours.sallesDeCours[0],
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
export const deleteSalleDeCours = async (req, res) => {
    const { salleDeCoursId } = req.params;

    try {
        // Vérifier si salleDeCoursId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(salleDeCoursId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const setting = await Setting.findOneAndUpdate(
            {},
            { $pull: { sallesDeCours: { _id: new mongoose.Types.ObjectId(salleDeCoursId) } } },
            { new: true }
        );

        if (!setting || !setting.sallesDeCours) {
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
