import Objectif from '../../../models/objectif.model.js';
import Matiere from '../../../models/matiere.model.js'
import Periode from '../../../models/periode.model.js'
import { message } from '../../../configs/message.js';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';

// create
export const createObjectif = async (req, res) => {
    const { code, libelleFr, libelleEn, etat, matiere } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !matiere) {
            return res.status(400).json({ 
                success: false, 
                message: message.champ_obligatoire
            });
        }

        // Vérifier si les ObjectId pour les références existent
        if (!mongoose.Types.ObjectId.isValid(matiere)) {
            return res.status(400).json({ success: false, message: message.identifiant_invalide });
        }

        // Vérifier si le code de existe déjà
        const existingCode = await Objectif.findOne({ code: code, matiere: matiere });
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: message.existe_code
            });
        }

        // Vérifier si le libelle fr de  existe déjà
        const existingLibelleFr = await Objectif.findOne({libelleFr: libelleFr, matiere: matiere});
        if (existingLibelleFr) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_fr,
            });
        }
        // Vérifier si le libelle en existe déjà
        const existingLibelleEn = await Objectif.findOne({libelleEn: libelleEn, matiere: matiere});

        if (existingLibelleEn) {
            return res.status(400).json({
                success: false,
                message: message.existe_libelle_en,
            });
        }
        const date_etat=undefined;
        // Créer une nouvelle instance d'Objectif
        const nouveauObjectif = new Objectif({
            code,
            libelleFr,
            libelleEn,
            etat,
            date_etat,
            matiere,
        });

        // Enregistrer le nouveau objectif dans la base de données
        const saveObjectif = await nouveauObjectif.save();
        await Matiere.findByIdAndUpdate(matiere, { $push: { objectifs: saveObjectif._id } });

        res.status(201).json({ success: true, message: message.ajouter_avec_success, data: saveObjectif });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du objectif :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};


// update
export const updateObjectif = async (req, res) => {
    const {objectifId} = req.params;
    const { code, libelleFr, libelleEn, etat, date_etat, matiere } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont présents
        if (!code || !libelleFr || !libelleEn || !matiere) {
            return res.status(400).json({ 
                success: false, 
                message: message.champ_obligatoire
            });
        }
        // Vérifier si le objectif existe
        const existingObjectif = await Objectif.findById(objectifId);
        if (!existingObjectif) {
            return res.status(404).json({ 
                success: false, 
                message: message.objectif_non_trouve 
            });
        }

        // Vérifier si les ObjectId pour les références existent
        if (!mongoose.Types.ObjectId.isValid(matiere)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide 
            });
        }

        // Vérifier si le code existe déjà (sauf pour l'événement actuel)
        if (existingObjectif.code !== code) {
            const existingCode = await Objectif.findOne({ code: code, matiere: matiere });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
        }

        //vérifier si le libelle fr existe déjà
        if (existingObjectif.libelleFr !== libelleFr) {
            const existingLibelleFr = await Objectif.findOne({ libelleFr: libelleFr, matiere: matiere });
            if (existingLibelleFr) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_fr
                });
            }
        }

        //vérifier si le libelle en  existe déjà
        if (existingObjectif.libelleEn !== libelleEn) {
            const existingLibelleEn = await Objectif.findOne({ libelleEn: libelleEn, matiere: matiere });
            if (existingLibelleEn) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_libelle_en
                });
            }
        }
        // Mettre à jour les champs du objectif
        existingObjectif.code = code;
        existingObjectif.libelleFr = libelleFr;
        existingObjectif.libelleEn = libelleEn;
        if(existingObjectif.etat!=etat){
            existingObjectif.date_etat = DateTime.now().toJSDate();
        }
        
        existingObjectif.etat = etat;
        existingObjectif.matiere = matiere;
        

        // Enregistrer les modifications
        const updatedObjectif = await existingObjectif.save();

        res.status(200).json({ 
            success: true, 
            message: message.mis_a_jour, 
            data: updatedObjectif 
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du objectif :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
}


// delete
export const deleteObjectif = async (req, res) => {
    const {objectifId}= req.params;

    try {
        // Vérifier si le objectif existe
        const existingObjectif = await Objectif.findById(objectifId);
        if (!existingObjectif) {
            return res.status(404).json({ 
                success: false, 
                message: message.objectif_non_trouve 
            });
        }

        // Supprimer le objectif de la liste des objectifs de sa matière associée
        await Matiere.findByIdAndUpdate(existingObjectif.matiere, { $pull: { objectifs: objectifId } });

        // Supprimer le objectif de la base de données
        await Objectif.findByIdAndDelete(objectifId);

        res.status(200).json({ success: true, message: message.supprimer_avec_success });
    } catch (error) {
        console.error('Erreur lors de la suppression du objectif :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
}

//update etat
export const updateObjectifEtatObj = async (req, res) => {
    const { objectifId }= req.params;
    const {etat } = req.query;

    try {
        // Vérifier si les ObjectId sont valides
        if (!mongoose.Types.ObjectId.isValid(objectifId)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide 
            });
        }

        // Vérifier si l'objectif existe
        const objectif = await Objectif.findById(objectifId);
        if (!objectif) {
            return res.status(404).json({ 
                success: false, message: 
                message.objectif_non_trouve 
            });
        }

    
        // Mettre à jour l'état de l'objectif
        objectif.etat = etat;
        if(etat == 1){
            objectif.date_etat = DateTime.now().toJSDate()
        }

        // Sauvegarder les modifications du objectif
        await objectif.save();

        res.status(200).json({ success: true, 
            //message: message.objectif_modifie, 
            data: objectif 
        });
    } catch (error) {
        console.error('Erreur lors de la modification de l\'état de l\'objectif :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
};

export const getProgressionGlobalEnseignantsObj = async (req, res) => {
    try {
        // Compter le nombre total d'objectifs avec l'état 1
        const totalObjectifsAvecEtat1 = await Objectif.countDocuments({ etat: 1 });

        // Compter le nombre total d'objectifs
        const totalObjectifs = await Objectif.countDocuments();

        // Calculer la progression globale
        const progressionGlobale = totalObjectifsAvecEtat1 / totalObjectifs;
        res.json({
            success: true,
            data: (progressionGlobale*100),
        });
    } catch (error) {
        console.error('Erreur lors du calcul de la progression globale des objectifs :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue lors du calcul de la progression globale des objectifs.' });
    }
};


export const getProgressionGlobalEnseignantsNiveauObj = async (req, res) => {
    const { niveauId } = req.params;
    try {
        // Récupérer toutes les matières liées au niveau
        const matieres = await Matiere.find({ niveau: niveauId }).populate('objectifs');

        let totalObjectifsAvecEtat1 = 0;
        let totalObjectifs = 0;

        // Pour chaque matière, compter le nombre total d'objectifs avec l'état 1 et le nombre total d'objectifs
        matieres.forEach(matiere => {
            matiere.objectifs.forEach(objectif => {
                if (objectif.etat == 1) {
                    totalObjectifsAvecEtat1++;
                }
                totalObjectifs++;
            });
        });

        // Calculer la progression globale
        const progressionGlobale = totalObjectifsAvecEtat1 / totalObjectifs * 100;

        res.json({
            success: true,
            data: progressionGlobale
        });
        
    } catch (error) {
        console.error('Erreur lors du calcul de la progression globale des enseignants :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue lors du calcul de la progression globale des enseignants.' });
    }
};

export const getProgressionGlobalEnseignantObj = async (req, res) => {
    const { enseignantId } = req.params;
    const {annee=2024, semestre=1}=req.query;
    try {
        // Récupérer toutes les matières où l'enseignant est soit l'enseignant principal, soit l'enseignant suppléant
        // const matieres = await Matiere.find({
        //     $or: [
        //         { 'typesEnseignement.enseignantPrincipal': enseignantId },
        //         { 'typesEnseignement.enseignantSuppleant': enseignantId }
        //     ]
        // }).populate('objectifs');

        // Création du filtre initial pour les périodes
        const filter = { 
            $or: [
                { enseignantPrincipal: enseignantId },
                { enseignantSuppleant: enseignantId }
            ]
        };

        // Si une année est spécifiée dans la requête, l'utiliser
        if (annee && !isNaN(annee)) {
            filter.annee = parseInt(annee);
            let periodesCurrentYear = await Periode.findOne(filter).exec();
            if (!periodesCurrentYear) {
                // Si aucune période pour l'année actuelle, rechercher dans les années précédentes jusqu'à en trouver une
                let found = false;
                let previousYear = parseInt(annee) - 1;
                while (!found && previousYear >= 2023) { // Limite arbitraire de 2023 pour éviter une boucle infinie
                    periodesCurrentYear = await Periode.findOne({ annee: previousYear, ...filter }).exec();
                    if (periodesCurrentYear) {
                        filter.annee = previousYear;
                        found = true;
                    } else {
                        previousYear--;
                    }
                }
            } 
        }

        // Si un semestre est spécifié dans la requête, l'utiliser
        if (semestre && !isNaN(semestre)) {
            filter.semestre = parseInt(semestre);
        }

        // Rechercher les périodes en fonction du filtre
        const periodes = await Periode.find(filter).select('matiere').exec();

        // Extraire les identifiants uniques des matières
        const matiereIds = [...new Set(periodes.map(periode => periode.matiere))];

        // Récupérer les détails de chaque matière à partir des identifiants uniques
        const matieres = await Matiere.find({ _id: { $in: matiereIds } }).populate('objectifs').exec();
        
        // console.log(matieres)
        let totalObjectifsAvecEtat1 = 0;
        let totalObjectifs = 0;
        console.log(periodes)
        // Pour chaque période de cours, compter le nombre total d'objectifs avec l'état 1 et le nombre total d'objectifs
        matieres.forEach(matiere => {
            matiere.objectifs.forEach(objectif => {
                if (objectif.etat === 1) {
                    totalObjectifsAvecEtat1++;
                }
                totalObjectifs++;
            });
        });

        // Pour chaque matière, compter le nombre total d'objectifs avec l'état 1 et le nombre total d'objectifs
        // matieres.forEach(matiere => {
        //     matiere.objectifs.forEach(objectif => {
        //         if (objectif.etat == 1) {
        //             totalObjectifsAvecEtat1++;
        //         }
        //         totalObjectifs++;
        //     });
        // });

        // Calculer la progression globale
        
        const progressionGlobale = totalObjectifsAvecEtat1 / totalObjectifs * 100;

        res.json({
            success: true,
            data: progressionGlobale
        });
        
    } catch (error) {
        console.error('Erreur lors du calcul de la progression globale de l\'enseignant :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue lors du calcul de la progression globale de l\'enseignant.' });
    }
};


export const getObjectifs = async (req, res) => {

    try {
        // Récupérer la liste des matières du niveau spécifié avec tous leurs détails
        const objectifs = await Objectif.find();
        
        

        res.status(200).json({ 
            success: true, 
            data: {
                objectifs ,
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
export const readObjectif = async (req, res) => { }


export const readObjectifs = async (req, res) => { }


