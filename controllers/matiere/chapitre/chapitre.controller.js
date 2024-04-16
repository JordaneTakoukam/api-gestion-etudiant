import Chapitre from '../../../models/chapitre.model.js';
import Matiere from '../../../models/matiere.model.js'
import { message } from '../../../configs/message.js';
import mongoose from 'mongoose';

// create
export const createChapitre = async (req, res) => {
    const { code, libelleFr, libelleEn, typesEnseignement, matiere, objectifs } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !typesEnseignement || !matiere) {
            return res.status(400).json({ 
                success: false, 
                message: message.champ_obligatoire
            });
        }

        // Vérifier si les ObjectId pour les références existent
        if (!mongoose.Types.ObjectId.isValid(matiere)) {
            return res.status(400).json({ success: false, message: message.identifiant_invalide });
        }

        for (const typeEnseignement of typesEnseignement) {
            if (!mongoose.Types.ObjectId.isValid(typeEnseignement.typeEnseignement)) {
                return res.status(400).json({ success: false, message: message.identifiant_invalide });
            }
        }

        // Vérifier si le code de existe déjà
        const existingCode = await Chapitre.findOne({ code: code, matiere: matiere });
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code
            });
        }

        // Vérifier si le libelle fr de  existe déjà
        const existingLibelleFr = await Chapitre.findOne({libelleFr: libelleFr, matiere: matiere});
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en existe déjà
        const existingLibelleEn = await Chapitre.findOne({libelleEn: libelleEn, matiere: matiere});

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }

        // Créer une nouvelle instance de Chapitre
        const nouveauChapitre = new Chapitre({
            code,
            libelleFr,
            libelleEn,
            typesEnseignement,
            matiere,
            objectifs
        });

        // Enregistrer le nouveau chapitre dans la base de données
        const saveChapitre = await nouveauChapitre.save();
        await Matiere.findByIdAndUpdate(matiere, { $push: { chapitres: saveChapitre._id } });

        res.status(201).json({ success: true, message: message.ajouter_avec_success, data: saveChapitre });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du chapitre :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};


// update
export const updateChapitre = async (req, res) => {
    const {chapitreId} = req.params;
    const { code, libelleFr, libelleEn, typesEnseignement, matiere, objectifs } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !typesEnseignement || !matiere) {
            return res.status(400).json({ 
                success: false, 
                message: message.champ_obligatoire
            });
        }
        // Vérifier si le chapitre existe
        const existingChapitre = await Chapitre.findById(chapitreId);
        if (!existingChapitre) {
            return res.status(404).json({ 
                success: false, 
                message: message.chapitre_non_trouve 
            });
        }

        // Vérifier si les ObjectId pour les références existent
        if (!mongoose.Types.ObjectId.isValid(matiere)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide 
            });
        }

        for (const typeEnseignement of typesEnseignement) {
            if (!mongoose.Types.ObjectId.isValid(typeEnseignement.typeEnseignement)) {
                return res.status(400).json({ 
                    success: false, 
                    message: message.identifiant_invalide 
                });
            }
        }

        // Vérifier si le code existe déjà (sauf pour l'événement actuel)
        if (existingChapitre.code !== code) {
            const existingCode = await Chapitre.findOne({ code: code, matiere: matiere });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }

        //vérifier si le libelle fr existe déjà
        if (existingChapitre.libelleFr !== libelleFr) {
            const existingLibelleFr = await Chapitre.findOne({ libelleFr: libelleFr, matiere: matiere });
            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }

        //vérifier si le libelle en  existe déjà
        if (existingChapitre.libelleEn !== libelleEn) {
            const existingLibelleEn = await Chapitre.findOne({ libelleEn: libelleEn, matiere: matiere });
            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }
        // Mettre à jour les champs du chapitre
        existingChapitre.code = code;
        existingChapitre.libelleFr = libelleFr;
        existingChapitre.libelleEn = libelleEn;
        existingChapitre.typesEnseignement = typesEnseignement;
        existingChapitre.matiere = matiere;
        existingChapitre.objectifs = objectifs;

        // Enregistrer les modifications
        const updatedChapitre = await existingChapitre.save();

        res.status(200).json({ 
            success: true, 
            message: message.mis_a_jour, 
            data: updatedChapitre 
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du chapitre :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
}


// delete
export const deleteChapitre = async (req, res) => {
    const {chapitreId}= req.params;

    try {
        // Vérifier si le chapitre existe
        const existingChapitre = await Chapitre.findById(chapitreId);
        if (!existingChapitre) {
            return res.status(404).json({ 
                success: false, 
                message: message.chapitre_non_trouve 
            });
        }

        // Supprimer le chapitre de la liste des chapitres de sa matière associée
        await Matiere.findByIdAndUpdate(existingChapitre.matiere, { $pull: { chapitres: chapitreId } });

        // Supprimer le chapitre de la base de données
        await Chapitre.findByIdAndDelete(chapitreId);

        res.status(200).json({ success: true, message: message.supprimer_avec_success });
    } catch (error) {
        console.error('Erreur lors de la suppression du chapitre :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
}

//update etat
export const updateObjectifEtat = async (req, res) => {
    const { chapitreId }= req.params;
    const {objectifId, etat } = req.query;

    try {
        // Vérifier si les ObjectId sont valides
        if (!mongoose.Types.ObjectId.isValid(chapitreId) || !mongoose.Types.ObjectId.isValid(objectifId)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide 
            });
        }

        // Vérifier si le chapitre existe
        const chapitre = await Chapitre.findById(chapitreId);
        if (!chapitre) {
            return res.status(404).json({ 
                success: false, message: 
                message.chapitre_non_trouve 
            });
        }

        // Trouver l'objectif dans le chapitre
        const objectif = chapitre.objectifs.id(objectifId);
        if (!objectif) {
            return res.status(404).json({ 
                success: false, message: 
                message.objectif_non_trouve 
            });
        }

        // Mettre à jour l'état de l'objectif
        objectif.etat = etat;

        // Sauvegarder les modifications du chapitre
        await chapitre.save();

        res.status(200).json({ success: true, 
            //message: message.objectif_modifie, 
            data: chapitre 
        });
    } catch (error) {
        console.error('Erreur lors de la modification de l\'état de l\'objectif :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};

export const getProgressionGlobalEnseignants = async (req, res) => {
    try {
        // Compter le nombre total d'objectifs des chapitres avec l'état 1
        const totalObjectifsAvecEtat1 = await Chapitre.countDocuments({ 'objectifs.etat': 1 });

        // Compter le nombre total d'objectifs
        const totalObjectifs = await Chapitre.aggregate([
            { $unwind: '$objectifs' },
            { $count: 'totalObjectifs' }
        ]);

        // Récupérer le nombre total d'objectifs à partir du résultat de l'agrégation
        const totalObjectifsCount = totalObjectifs.length > 0 ? totalObjectifs[0].totalObjectifs : 0;

        // Calculer la progression globale
        const progressionGlobale = totalObjectifsAvecEtat1 / totalObjectifsCount;
        res.json({
            success: true,
            data: (progressionGlobale*100),
            
        });
        
    } catch (error) {
        console.error('Erreur lors du calcul de la progression globale des enseignants :', error);
        return { success: false, message: 'Une erreur est survenue lors du calcul de la progression globale des enseignants.' };
    }
};

export const getProgressionGlobalEnseignantsNiveau = async (req, res) => {
    try {
        // Compter le nombre total d'objectifs des chapitres avec l'état 1
        const totalObjectifsAvecEtat1 = await Chapitre.countDocuments({ 'objectifs.etat': 1 });

        // Compter le nombre total d'objectifs
        const totalObjectifs = await Chapitre.aggregate([
            { $unwind: '$objectifs' },
            { $count: 'totalObjectifs' }
        ]);

        // Récupérer le nombre total d'objectifs à partir du résultat de l'agrégation
        const totalObjectifsCount = totalObjectifs.length > 0 ? totalObjectifs[0].totalObjectifs : 0;

        // Calculer la progression globale
        const progressionGlobale = totalObjectifsAvecEtat1 / totalObjectifsCount;
        res.json({
            success: true,
            data: (progressionGlobale*100),
            
        });
        
    } catch (error) {
        console.error('Erreur lors du calcul de la progression globale des enseignants :', error);
        return { success: false, message: 'Une erreur est survenue lors du calcul de la progression globale des enseignants.' };
    }
};

export const getChapitres = async (req, res) => {

    try {
        // Récupérer la liste des matières du niveau spécifié avec tous leurs détails
        const chapitres = await Chapitre.find();
        
        

        res.status(200).json({ 
            success: true, 
            data: {
                chapitres ,
                totalPages: 0,
                currentPage: 0,
                totalItems: 0,
                pageSize:0
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des matières par niveau :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};



// read
export const readChapitre = async (req, res) => { }


export const readChapitres = async (req, res) => { }


