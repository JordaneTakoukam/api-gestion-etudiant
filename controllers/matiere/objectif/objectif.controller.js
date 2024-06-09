import Objectif from '../../../models/objectif.model.js';
import Matiere from '../../../models/matiere.model.js'
import Periode from '../../../models/periode.model.js'
import { message } from '../../../configs/message.js';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import { extractRawText } from 'mammoth';

// create
export const createObjectif = async (req, res) => {
    const {annee, semestre, code, libelleFr, libelleEn, etat, matiere } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont présents
        if (!annee || !semestre || !libelleFr || !libelleEn || !matiere) {
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
        if(code){
            const existingCode = await Objectif.findOne({ code: code, matiere: matiere });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
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
            annee,
            semestre,
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
    const {annee, semestre, code, libelleFr, libelleEn, etat, date_etat, matiere } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont présents
        if (!annee || !semestre || !libelleFr || !libelleEn || !matiere) {
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
        if (code && existingObjectif.code !== code) {
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
        existingObjectif.annee = annee;
        existingObjectif.semestre = semestre;
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

export const getProgressionMatiere = async (req, res) => {
    const{matiereId}=req.params;
    const {annee=2023, semestre=1}=req.query;
    try {
        // Compter le nombre total d'objectifs avec l'état 1
        const totalObjectifsAvecEtat1 = await Objectif.countDocuments({ matiere:matiereId, etat: 1, annee:annee, semestre:semestre});

        // Compter le nombre total d'objectifs
        const totalObjectifs = await Objectif.countDocuments({matiere:matiereId, annee:annee, semestre:semestre});

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

export const getProgressionGlobalEnseignantsObj = async (req, res) => {
    const {annee=2023, semestre=1}=req.query;
    try {
        // Compter le nombre total d'objectifs avec l'état 1
        const totalObjectifsAvecEtat1 = await Objectif.countDocuments({ etat: 1 , annee:annee, semestre:semestre});

        // Compter le nombre total d'objectifs
        const totalObjectifs = await Objectif.countDocuments({annee:annee, semestre:semestre});

        // Calculer la progression globale
        let progressionGlobale = 0;
        if(totalObjectifs != 0){
            progressionGlobale = totalObjectifsAvecEtat1 / totalObjectifs;
        }
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
    const {annee=2023, semestre=1}=req.query;
    try {
        // Récupérer toutes les matières liées au niveau
        // const matieres = await Matiere.find({ niveau: niveauId }).populate('objectifs');

        const filter = { 
            niveau: niveauId
        };

        // Si une année est spécifiée dans la requête, l'utiliser
        if (annee && !isNaN(annee)) {
            filter.annee = parseInt(annee);
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
        const matieres = await Matiere.find({ _id: { $in: matiereIds } })
                        .populate('objectifs');


        let totalObjectifsAvecEtat1 = 0;
        let totalObjectifs = 0;

        // Pour chaque matière, compter le nombre total d'objectifs avec l'état 1 et le nombre total d'objectifs
        matieres.forEach(matiere => {
            matiere.objectifs.forEach(objectif => {
                if ( objectif.annee==annee && objectif.semestre==semestre) {
                    if(objectif.etat == 1){
                        totalObjectifsAvecEtat1++;
                    }
                    totalObjectifs++;
                }
                
                
            });
        });

        // Calculer la progression globale
        let progressionGlobale = 0;
        if(totalObjectifs != 0){
            progressionGlobale = totalObjectifsAvecEtat1 / totalObjectifs;
        }
        res.json({
            success: true,
            data: (progressionGlobale*100),
        });

        
        
    } catch (error) {
        console.error('Erreur lors du calcul de la progression globale des enseignants :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue lors du calcul de la progression globale des enseignants.' });
    }
};

export const getProgressionGlobalEnseignantObj = async (req, res) => {
    const { enseignantId } = req.params;
    const {annee=2023, semestre=1}=req.query;
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
                if(objectif.annee==annee && objectif.semestre == semestre){
                    if (objectif.etat === 1) {
                        totalObjectifsAvecEtat1++;
                    }
                    totalObjectifs++;
                }
                
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
        
        let progressionGlobale = 0;
        if(totalObjectifs != 0){
            progressionGlobale = totalObjectifsAvecEtat1 / totalObjectifs;
        }
        res.json({
            success: true,
            data: (progressionGlobale*100),
        });
        
    } catch (error) {
        console.error('Erreur lors du calcul de la progression globale de l\'enseignant :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue lors du calcul de la progression globale de l\'enseignant.' });
    }
};

export const getObjectifs = async (req, res) => {
    const {matiereId}=req.params;
    let {page=1, pageSize=10, annee, semestre, langue}=req.query;
    
    try {
        page=parseInt(page);
        pageSize=parseInt(pageSize);
        semestre = parseInt(semestre);
        annee=parseInt(annee);
         // Récupération des objectifs avec pagination
         const startIndex = (page - 1) * pageSize;

        // Récupérer la liste des objectifs d'une matière
        let objectifs = [];
        if(langue === 'fr'){
            objectifs = await Objectif.find({matiere:matiereId, annee:annee, semestre:semestre})
                        .sort({libelleFr:1})
                        .skip(startIndex)
                        .limit(pageSize);
        }else{
            objectifs = await Objectif.find({matiere:matiereId, annee:annee, semestre:semestre})
                        .sort({libelleEn:1})
                        .skip(startIndex)
                        .limit(pageSize);
        }
        console.log(objectifs);
        // Comptage total des objectifs pour la pagination
        const totalObjectifs = await Objectif.countDocuments({matiere:matiereId, annee:annee, semestre:semestre});
        const totalPages = Math.ceil(totalObjectifs / pageSize);
        
        res.status(200).json({ 
            success: true, 
            data: {
                objectifs ,
                totalPages: totalPages,
                currentPage: page,
                totalItems: totalObjectifs,
                pageSize:pageSize
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des objectif :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};

export const searchObjectif = async (req, res) => {
    const { langue, searchString } = req.params; // Récupère la chaîne de recherche depuis les paramètres de requête
    let {limit = 10, matiereId, annee} = req.query;
    limit = parseInt(limit);
    // console.log(searchString);
    try {
        // Construire la requête pour filtrer les matières
        let query = {
             libelleFr: { $regex: `^${searchString}`, $options: 'i' }, 
             matiere:matiereId,
             annee:annee
        }
        if(langue!=='fr'){
            query = {
                libelleEn: { $regex: `^${searchString}`, $options: 'i' },
                matiere:matiereId,
                annee:annee 
            }
        }

        let objectifs = [];

        if(langue ==='fr'){
            objectifs = await Objectif.find(query)
                .sort({ libelleFr: 1 }) 
                .limit(limit); // Limite à 5 résultats
        }else{
            objectifs = await Objectif.find(query)
                .sort({libelleEn: 1 }) 
                .limit(limit); // Limite à 5 résultats
        }
        

        res.json({
            success: true,
            data: {
                objectifs,
                currentPage: 0,
                totalPages: 1,
                totalItems: objectifs.length,
                pageSize: 10,
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des matières :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
};


async function lireDonneesFichierWord(matieres, fichier, fichierEn) {
    const data = await extractRawText({ path: fichier });
    const dataEn = await extractRawText({ path: fichierEn });
    const text = data.value;
    const textEn = dataEn.value;
    
    // Structure pour stocker les données
    const donnees = [];
    let currentObjectif = null;
    let currentMatiere = null;

    // Split text into lines
    const lines = text.split('\n');
    const linesEn = textEn.split('\n');
    
    lines.forEach((line, index) => {
        line = line.trim();
        
        if (line.length === 0) return;

        // Détection du titre de la matière
        const matiere = matieres.find(m => line.includes(m.libelleFr));
        if (matiere) {
            currentMatiere = matiere;
        }

        // Si on doit capturer les lignes après "Compétences acquises"
        if (line.startsWith('Compétences acquises')) {
            const competencesFr = line.replace("Compétences acquises :", "").trim().split(';');
            const competencesEn = linesEn[index].replace("Acquired skills :", "").trim().split(';');
            
            competencesFr.forEach((competenceFr, ind) => {
                currentObjectif = {
                    annee:2023,
                    semestre:3,
                    code:"",
                    libelleFr: competenceFr.trim(),
                    libelleEn: competencesEn[ind].trim(),
                    matiere: currentMatiere ? currentMatiere._id : '',
                    etat:0,
                    date_etat:undefined
                };
                donnees.push(currentObjectif);
            });
        }
    });
    
    return donnees;
}

export const createManyObjectif = async (req, res) => {
    try {
        const filePath = './maquette_fr.docx';
        const filePathEn = './maquette_en.docx';
        // const matieres = await Matiere.find({}).select('_id libelleFr');
        // const donnees = await lireDonneesFichierWord(matieres, filePath, filePathEn);

        // // Insérer les objectifs dans la base de données
        // const result = await Objectif.insertMany(donnees);

        // // Mettre à jour chaque matière avec les ObjectIds des objectifs créés
        // for (const objectif of result) {
        //     await Matiere.findByIdAndUpdate(objectif.matiere, { $push: { objectifs: objectif._id } });
        // }
        const matiereId = "6659d2d721eb5da854409fa7";
        const semestre = 2;
        const objectifs = await Objectif.find({ matiere: matiereId, semestre: semestre });

        // Récupérer les IDs des objectifs trouvés
        const objectifIds = objectifs.map(objectif => objectif._id);

        // Mettre à jour la matière pour supprimer les références des chapitres (objectifs)
        const result = await Matiere.updateOne(
            { _id: matiereId },
            { $pull: { chapitres: { $in: objectifIds } } }
        );

        

        res.status(201).json({ success: true, message: "Ajouté avec succès", data: objectifs });
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, message: "Erreur lors de l'ajout des objectifs", error: e.message });
    }
}

const capitalizeFirstLetter = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const updateLibelles = async (req, res) => {
    try {
      // Mettre à jour tous les libelleFr et libelleEn en retirant les espaces en début et en fin
      const objectifs = await Objectif.find({});

      // Parcourir chaque objectif pour mettre à jour les libelles
      for (let objectif of objectifs) {
        const updatedLibelleFr = capitalizeFirstLetter(objectif.libelleFr.trim());
        const updatedLibelleEn = capitalizeFirstLetter(objectif.libelleEn.trim());
  
        await Objectif.updateOne(
          { _id: objectif._id },
          {
            $set: {
              libelleFr: updatedLibelleFr,
              libelleEn: updatedLibelleEn,
            },
          }
        );
      }
  
      res.status(201).json({ success: true, message: "Modifié avec succès"});
    } catch (error) {
      console.error('Erreur lors de la mise à jour des libelles :', error);
      
    }
  };


// read
export const readObjectif = async (req, res) => { }


export const readObjectifs = async (req, res) => { }


