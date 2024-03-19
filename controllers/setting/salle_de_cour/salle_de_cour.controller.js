import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';



// create
export const createSalleDeCours = async (req, res) => {
    const { code, libelleFr, libelleEn, nbPlace} = req.body;

    try {
        // Vérifier si le code de la salle de cours existe déjà
        const existingCode = await Setting.findOne({
            'salleDeCours.code': code,
        });
        
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code,
            });
        }
        // Vérifier si le libelle fr de la salle de cours existe déjà
        const existingLibelleFr = await Setting.findOne({
            'salleDeCours.libelleFr': libelleFr,
        });
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en de la salle de cours existe déjà
        const existingLibelleEn = await Setting.findOne({
            'salleDeCours.libelleEn': libelleEn,
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
            data = await Setting.create({ salleDeCours: [newSalleDeCours] });
        } else {
            // Mettre à jour le document existant
            data = await Setting.findOneAndUpdate({}, { $push: { salleDeCours: newSalleDeCours } }, { new: true });
        }

        // Retourner uniquement l'objet ajouté
        const createdSalleDeCours = data.salleDeCours.find((salleDeCours) => salleDeCours.code === code);

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

//
//
//
//
//
//
//
//
// update
export const updateSalleDeCours = async (req, res) => {
    const { salleDeCoursId } = req.params;
    const { code, libelleFr, libelleEn, nbPlace } = req.body;

    try {
        // Vérifier si salledecoursId est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(salleDeCoursId)) {
            return res.status(400).json({
                success: false,
                message: "hello",
            });
        }

        // // Vérifier si le code de la salle de cours existe déjà
        // const existingCode = await Setting.findOne({
        //     'salledecours.code': code,
        // });
        
        // if (existingCode) {
        //     return res.status(400).json({
        //         success: false,
        //         message: message.existe_code,
        //     });
        // }
        // // Vérifier si le libelle fr de la salle de cours existe déjà
        // const existingLibelleFr = await Setting.findOne({
        //     'salledecours.libelleFr': libelleFr,
        // });
        // if (existingLibelleFr) {
        //     return res.status(400).json({
        //         success: false,
        //         message: message.existe_libelle_fr,
        //     });
        // }
        // // Vérifier si le libelle en de la salle de cours existe déjà
        // const existingLibelleEn = await Setting.findOne({
        //     'salledecours.libelleEn': libelleEn,
        // });

        // if (existingLibelleEn) {
        //     return res.status(400).json({
        //         success: false,
        //         message: message.existe_libelle_en,
        //     });
        // }
        
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
            { "salleDeCours._id": new mongoose.Types.ObjectId(salleDeCoursId) }, // Trouver la salle de cours par son ID
            { $set: { "salleDeCours.$.code": code, "salleDeCours.$.libelleFr": libelleFr, "salleDeCours.$.libelleEn": libelleEn, "salleDeCours.$.date_creation": DateTime.now().toJSDate() } }, // Mettre à jour la salle de cours
            { new: true, projection: { _id: 0, salleDeCours: { $elemMatch: { _id: new mongoose.Types.ObjectId(salleDeCoursId) } } } } // Renvoyer uniquement la salle de cours mise à jour
        );

        // Vérifier si la salle de cours existe
        if (!updatedSalleDeCours || !updatedSalleDeCours.salleDeCours || !updatedSalleDeCours.salleDeCours.length) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee,
            });
        }

        // Envoyer la réponse avec l'objet mis à jour
        return res.json({
            success: true,
            message: message.mis_a_jour,
            data: updatedSalleDeCours.salleDeCours[0],
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        return res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};






//
//
//
//
//

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
            { $pull: { salleDeCours: { _id: new mongoose.Types.ObjectId(salleDeCoursId) } } },
            { new: true }
        );

        if (!setting || !setting.salleDeCours) {
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
