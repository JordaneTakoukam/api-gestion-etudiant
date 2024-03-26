import Matiere from '../../models/matiere.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
// create
export const createMatiere = async (req, res) => { 
    const { code, libelleFr, libelleEn, niveau, prerequisFr, prerequisEn, approchePedFr, approchePedEn, evaluationAcquisFr, evaluationAcquisEn, typesEnseignement, chapitres } = req.body;

    try {

        // Vérifier que tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !niveau || !typesEnseignement) {
            return res.status(400).json({ success: false, message: message.champ_obligatoire });
        }

        // Vérifier si les ObjectId pour les références existent
        if (!mongoose.Types.ObjectId.isValid(niveau)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide
            });
        }

        for (const typeEnseignement of typesEnseignement) {
            if (!mongoose.Types.ObjectId.isValid(typeEnseignement.typeEnseignement)) {
                return res.status(400).json({ 
                    success: false, 
                    message: message.identifiant_invalide,
                });
            }
            if (!mongoose.Types.ObjectId.isValid(typeEnseignement.enseignantsPrincipaux)) {
                return res.status(400).json({ 
                    success: false, 
                    message: message.identifiant_invalide,
                });
            }
            
            if (typeEnseignement.enseignantsSuppleants && !mongoose.Types.ObjectId.isValid(typeEnseignement.enseignantsSuppleants)) {
                return res.status(400).json({ 
                    success: false, 
                    message: message.identifiant_invalide,
                });
            }
        }

        if (chapitres) {
            for (const chapitre of chapitres) {
                if (!mongoose.Types.ObjectId.isValid(chapitre)) {
                    return res.status(400).json({ 
                        success: false, 
                        message: message.identifiant_invalide,
                    });
                }
            }
        }

        // Vérifier si le code de existe déjà
        const existingCode = await Matiere.findOne({ code: code });
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code
            });
        }

        // Vérifier si le libelle fr de  existe déjà
        const existingLibelleFr = await Matiere.findOne({libelleFr: libelleFr});
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en existe déjà
        const existingLibelleEn = await Matiere.findOne({libelleEn: libelleEn});

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }
        // Créer une nouvelle matière avec les données reçues
        const nouvelleMatiere = new Matiere({
            code,
            libelleFr,
            libelleEn,
            niveau,
            prerequisFr,
            prerequisEn,
            approchePedFr,
            approchePedEn,
            evaluationAcquisFr,
            evaluationAcquisEn,
            typesEnseignement,
            chapitres
        });

        // Enregistrer la nouvelle matière dans la base de données
        const saveMatiere = await nouvelleMatiere.save();

        res.status(200).json({ 
            success: true, 
            message: message.ajouter_avec_success,
            data:saveMatiere });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la matière :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
}

// update
export const updateMatiere = async (req, res) => {
    const { matiereId } = req.params; // Récupérer l'ID de la matière depuis les paramètres de la requête
    const { code, libelleFr, libelleEn, niveau, prerequisFr, prerequisEn, approchePedFr, approchePedEn, evaluationAcquisFr, evaluationAcquisEn, typesEnseignement, chapitres } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !niveau || !typesEnseignement) {
            return res.status(400).json({ success: false, message: message.champ_obligatoire });
        }
        // Vérifier si l'ID de la matière est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(matiereId)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide
            });
        }

        // Vérifier si la matière à modifier existe dans la base de données
        const existingMatiere = await Matiere.findById(matiereId);
        if (!existingMatiere) {
            return res.status(404).json({ 
                success: false, 
                message: message.matiere_non_trouvee
            });
        }

        // Vérifier si le code existe déjà (sauf pour l'événement actuel)
        if (existingMatiere.code !== code) {
            const existingCode = await Matiere.findOne({ code: code });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }

        //vérifier si le libelle fr existe déjà
        if (existingMatiere.libelleFr !== libelleFr) {
            const existingCode = await Matiere.findOne({ libelleFr: libelleFr });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }

        //vérifier si le libelle en  existe déjà
        if (existingMatiere.libelleEn !== libelleEn) {
            const existingCode = await Matiere.findOne({ libelleEn: libelleEn });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }


        // Mettre à jour les champs de la matière avec les nouvelles valeurs
        existingMatiere.code = code;
        existingMatiere.libelleFr = libelleFr;
        existingMatiere.libelleEn = libelleEn;
        existingMatiere.niveau = niveau;
        existingMatiere.prerequisFr = prerequisFr;
        existingMatiere.prerequisEn = prerequisEn;
        existingMatiere.approchePedFr = approchePedFr;
        existingMatiere.approchePedEn = approchePedEn;
        existingMatiere.evaluationAcquisFr = evaluationAcquisFr;
        existingMatiere.evaluationAcquisEn = evaluationAcquisEn;
        existingMatiere.typesEnseignement = typesEnseignement;
        existingMatiere.chapitres = chapitres;

        // Enregistrer les modifications dans la base de données
        const updatedMatiere = await existingMatiere.save();

        res.status(200).json({ 
            success: true, 
            message: message.mis_a_jour,
            data: updatedMatiere
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la matière :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
}



// delete
export const deleteMatiere = async (req, res) => {
    const { matiereId } = req.params;

    try {
        // Vérifier si l'ID de la matiere est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(matiereId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        
        // Supprimer la matiere par son ID
        const deletedMatiere = await Matiere.findByIdAndDelete(matiereId);
        if (!deletedMatiere) {
            return res.status(404).json({
                success: false,
                message: message.matiere_non_trouvee
            });
        }

        res.json({
            success: true,
            message: message.supprimer_avec_success
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
}


// read
export const readMatiere = async (req, res) => { }


export const readMatieres = async (req, res) => { }


