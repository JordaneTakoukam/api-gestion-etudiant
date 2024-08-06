import Chapitre from '../../../models/chapitre.model.js';
import Matiere from '../../../models/matiere.model.js'
import { message } from '../../../configs/message.js';
import mongoose from 'mongoose';
import { extractRawText } from 'mammoth';
import { io } from '../../../server.js';
import Notification from '../../../models/notification.model.js';
import { appConfigs } from '../../../configs/app_configs.js';
import Objectif from '../../../models/objectif.model.js';

// create
export const createChapitre = async (req, res) => {
    const {annee, semestre, code, libelleFr, libelleEn, typesEnseignement,statut, user, matiere, objectifs } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont présents
        if (!annee || !semestre || !libelleFr || !libelleEn || !typesEnseignement || !matiere) {
            return res.status(400).json({ 
                success: false, 
                message: message.champ_obligatoire
            });
        }

        

        // Vérifier si les ObjectId pour les références existent
        if (!mongoose.Types.ObjectId.isValid(matiere)) {
            return res.status(400).json({ success: false, message: message.identifiant_invalide });
        }

        if (!mongoose.Types.ObjectId.isValid(user)) {
            return res.status(400).json({ success: false, message: message.identifiant_invalide });
        }

        for (const typeEnseignement of typesEnseignement) {
            if (!mongoose.Types.ObjectId.isValid(typeEnseignement.typeEnseignement)) {
                return res.status(400).json({ success: false, message: message.identifiant_invalide });
            }
        }

        // Vérifier si le code de existe déjà
        if(code){
            const existingCode = await Chapitre.findOne({ code: code, matiere: matiere });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: message.existe_code
                });
            }
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
            annee,
            semestre,
            code,
            libelleFr,
            libelleEn,
            typesEnseignement,
            statut,
            matiere,
        });

        // Enregistrer le nouveau chapitre dans la base de données
        const saveChapitre = await nouveauChapitre.save();
        await Matiere.findByIdAndUpdate(matiere, { $push: { chapitres: saveChapitre._id } });
        if(statut==0){
            const notification = new Notification({
                type:appConfigs.typeNotifications.approbation_chap,
                role:appConfigs.role.enseignant,
                user:user,
                chapitre:saveChapitre._id,
            });
            const savedNotification = await notification.save();
            const populateNotification = await Notification.populate(savedNotification, [
                { path: 'user', select: '_id nom prenom' }, 
                { path: 'chapitre', select: '_id libelleFr libelleEn matiere',  populate: {path: 'matiere',select: '_id libelleFr libelleEn' }, options: { strictPopulate: false }}, 
            ]);
            // Émettre la notification via Socket.IO
            const dataReturn = {
                ...populateNotification._doc
            };
            io.emit('message', dataReturn);
            
        }

        res.status(201).json({ success: true, message: message.ajouter_avec_success, data: saveChapitre });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du chapitre :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};


// update
export const updateChapitre = async (req, res) => {
    const {chapitreId} = req.params;
    const { annee, semestre, code, libelleFr, libelleEn, typesEnseignement, matiere, objectifs, statut } = req.body;

    try {
        // Vérifier que tous les champs obligatoires sont présents
        if (!annee || !semestre || !libelleFr || !libelleEn || !typesEnseignement || !matiere) {
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
        if (!mongoose.Types.ObjectId.isValid(matiere._id)) {
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
        if (code && existingChapitre.code !== code) {
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
        existingChapitre.annee = annee;
        existingChapitre.semestre = semestre;
        existingChapitre.code = code;
        existingChapitre.libelleFr = libelleFr;
        existingChapitre.libelleEn = libelleEn;
        existingChapitre.typesEnseignement = typesEnseignement;
        existingChapitre.matiere = matiere._id;
        existingChapitre.objectifs = objectifs;
        existingChapitre.statut=statut;

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

export const updateStatutChap = async (req, res) => {
    const {chapitre} = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(chapitre)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide 
            });
        }
  
        const updatedChapitre = await Chapitre.findByIdAndUpdate(
            chapitre,
            { $set: { statut: 1 } },
            { new: true }
        );

        if (!updatedChapitre) {
            return res.status(404).json({ 
                success: false, 
                message: message.chapitre_non_trouve 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: message.mis_a_jour, 
            data: updatedChapitre 
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour :', error);
        return res.status(500).json({ 
            success: true, 
            message: message.erreurServeur, 
        });
      
    }
};


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
export const updateChapitreEtat = async (req, res) => {
    const { chapitreId } = req.params;
    const { objectifs, etat } = req.body; // Liste des objectifs avec leur état

    try {
        // Vérifier si le chapitre existe
        const chapitre = await Chapitre.findById(chapitreId);
        if (!chapitre) {
            return res.status(404).json({
                success: false,
                message: message.chapitre_non_trouve
            });
        }
        if(objectifs && objectifs.length>0){
            // Mettre à jour l'état des objectifs fournis
            const updateObjectifs = objectifs.map(async (objectifData) => {
                const objectif = await Objectif.findById(objectifData._id);
                if (objectif) {
                    objectif.etat = objectifData.etat;
                    await objectif.save();
                }
            });

            await Promise.all(updateObjectifs);

            // Vérifier si tous les objectifs sont à l'état 1
            const updatedObjectifs = await Objectif.find({ _id: { $in: objectifs.map(obj => obj._id) } });
            const allObjectivesAreOne = updatedObjectifs.every(obj => obj.etat === 1);

            // Mettre à jour l'état du chapitre
            
            chapitre.etat = allObjectivesAreOne ? 1 : 0; 
        }else{
            chapitre.etat = etat; 
        }
               
        await chapitre.save();
        const chapitreUpdate = await Chapitre.findById(chapitre._id).populate({path:'objectifs', select:'_id libelleFr libelleEn etat', options:{strictPopulate:false}})
        res.status(200).json({
            success: true,
            message: message.mis_a_jour,
            data: chapitreUpdate
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du chapitre :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};

export const getProgressionMatiereChapitre = async (req, res) => {
    const{matiereId}=req.params;
    const {annee=2023, semestre=1}=req.query;
    try {
        // Compter le nombre total d'chapitres avec l'état 1
        const totalChapitresAvecEtat1 = await Chapitre.countDocuments({ matiere:matiereId, etat: 1, annee:annee, semestre:semestre});

        // Compter le nombre total d'chapitres
        const totalChapitres = await Chapitre.countDocuments({matiere:matiereId, annee:annee, semestre:semestre});

        // Calculer la progression globale
        const progressionGlobale = totalChapitresAvecEtat1 / totalChapitres;
        res.json({
            success: true,
            data: (progressionGlobale*100),
        });
    } catch (error) {
        console.error('Erreur lors du calcul de la progression globale des chapitres :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};

export const getProgressionGlobalEnseignants = async (req, res) => {
    const {annee, semestre}=req.query;
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
    const { niveauId } = req.params;
    try {
        // Récupérer toutes les matières liées au niveau
        const matieres = await Matiere.find({ niveau: niveauId }).populate('chapitres');

        let totalObjectifsAvecEtat1 = 0;
        let totalObjectifs = 0;

        // Pour chaque matière, compter le nombre total d'objectifs avec l'état 1 et le nombre total d'objectifs
        matieres.forEach(matiere => {
            matiere.chapitres.forEach(chapitre => {
                chapitre.objectifs.forEach(objectif => {
                    if (objectif.etat === 1) {
                        totalObjectifsAvecEtat1++;
                    }
                    totalObjectifs++;
                });
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

export const getProgressionGlobalEnseignant = async (req, res) => {
    const { enseignantId } = req.params;
    try {
        // Récupérer toutes les matières où l'enseignant est soit l'enseignant principal, soit l'enseignant suppléant
        const matieres = await Matiere.find({
            $or: [
                { 'typesEnseignement.enseignantPrincipal': enseignantId },
                { 'typesEnseignement.enseignantSuppleant': enseignantId }
            ]
        }).populate('chapitres');

        let totalObjectifsAvecEtat1 = 0;
        let totalObjectifs = 0;

        // Pour chaque matière, compter le nombre total d'objectifs avec l'état 1 et le nombre total d'objectifs
        matieres.forEach(matiere => {
            matiere.chapitres.forEach(chapitre => {
                chapitre.objectifs.forEach(objectif => {
                    if (objectif.etat === 1) {
                        totalObjectifsAvecEtat1++;
                    }
                    totalObjectifs++;
                });
            });
        });

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


export const getChapitres = async (req, res) => {
    const {matiereId}=req.params;
    const {page=1, pageSize=10, annee, semestre, langue}=req.query;
    try {
         // Récupération des chapitres avec pagination
         const startIndex = (page - 1) * pageSize;

        // Récupérer la liste des chapitres d'une matière
        let chapitres = [];
        if(langue === 'fr'){
            chapitres = await Chapitre.find({matiere:matiereId, annee:annee, semestre:semestre})
                        .populate('matiere', '_id libelleFr libelleEn')
                        .populate({path:'objectifs', select:"_id libelleFr libelleEn etat", options: { strictPopulate: false }})
                        .sort({libelleFr:1})
                        .skip(startIndex)
                        .limit(parseInt(pageSize));
        }else{
            chapitres = await Chapitre.find({matiere:matiereId, annee:annee, semestre:semestre})
                        .populate('matiere', '_id libelleFr libelleEn')
                        .populate({path:'objectifs', select:"_id libelleFr libelleEn etat", options: { strictPopulate: false }})
                        .sort({libelleEn:1})
                        .skip(startIndex)
                        .limit(parseInt(pageSize));
        }
        // Comptage total des chapitres pour la pagination
        const totalChapitres = await Chapitre.countDocuments({matiere:matiereId, annee:annee, semestre:semestre});
        const totalPages = Math.ceil(totalChapitres / parseInt(pageSize));
        
        res.status(200).json({ 
            success: true, 
            data: {
                chapitres ,
                totalPages: totalPages,
                currentPage: page,
                totalItems: totalChapitres,
                pageSize:pageSize
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des chapitre :', error);
        res.status(500).json({ success: false, message: message.erreurServeur });
    }
};

export const searchChapitre = async (req, res) => {
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

        let chapitres = [];

        if(langue ==='fr'){
            chapitres = await Chapitre.find(query)
                .populate('matiere', '_id libelleFr libelleEn')
                .sort({ libelleFr: 1 }) 
                .limit(limit); // Limite à 5 résultats
        }else{
            chapitres = await Chapitre.find(query)
                .populate('matiere', '_id libelleFr libelleEn')
                .sort({libelleEn: 1 }) 
                .limit(limit); // Limite à 5 résultats
        }
        

        res.json({
            success: true,
            data: {
                chapitres,
                currentPage: 0,
                totalPages: 1,
                totalItems: chapitres.length,
                pageSize: 10,
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des matières :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
};

async function lireDonneesFichierWord(matieres,fichier, fichierEn) {
    const data = await extractRawText({ path: fichier });
    const dataEn = await extractRawText({ path: fichierEn });
    const text = data.value;
    const textEn = dataEn.value;
    let currentMatiere = null;
    let currentChapitre = null;
    let CM = 0, TD = 0, TP = 0;
    
    // Structure pour stocker les données
    const donnees = [];
    let captureNextLines = false;
    let captureNextLinesAcquis = false; 

    // Split text into lines
    // const lines = text.trim().split('\n');
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let previousLineWasText = false;
    const linesEn = textEn.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    lines.forEach((line, index) => {
        line = line.trim();
            
        if (line.length === 0) return;
        
        if (line.startsWith('Matières') || line.startsWith('CM') || line.startsWith('TD') || line.startsWith('TP') 
        || line.startsWith('Intervenants') || line.startsWith('Compétences acquises') || line.startsWith('Prérequis') 
        || line.startsWith('Approche pédagogique') || line.startsWith('Evaluation des acquis')) {
            // captureNextLines = true;
            return; // Skip the "Compétences acquises" line
        }
       

        if (!isNaN(line)) {
            const hours = parseInt(line, 10);
            if (previousLineWasText) {
                // La ligne précédente était un texte, donc c'est le titre du chapitre
                currentChapitre = {
                    annee:2023,
                    semestre:3,
                    code:"",
                    libelleFr: lines[index - 1],
                    libelleEn: linesEn[index - 1],
                    typesEnseignement: [{
                        typeEnseignement: "660238e437b0ee5bea8089ce",
                        volumeHoraire: 0
                    },
                    {
                        typeEnseignement: "66023adcd4b5f4df62c2d219",
                        volumeHoraire: 0
                    },
                    {
                        typeEnseignement:"66023b02d4b5f4df62c2d255", 
                        volumeHoraire: 0
                    }],
                    matiere: currentMatiere._id,
                };
                donnees.push(currentChapitre);
            }

            // Déterminer le type d'heures
            if (currentChapitre.typesEnseignement[0].volumeHoraire === 0) {
                currentChapitre.typesEnseignement[0].volumeHoraire = hours;
            } else if (currentChapitre.typesEnseignement[1].volumeHoraire === 0) {
                currentChapitre.typesEnseignement[1].volumeHoraire = hours;
            } else if (currentChapitre.typesEnseignement[2].volumeHoraire === 0) {
                currentChapitre.typesEnseignement[2].volumeHoraire = hours;
            }

            previousLineWasText = false;
        } else {
            if (previousLineWasText) {
                // Si la ligne précédente était aussi du texte, alors c'est une nouvelle matière
                // currentMatiere = lines[index - 1];
                const matiere = matieres.find(m => lines[index - 1].includes(m.libelleFr));
                if (matiere) {
                    currentMatiere = matiere;
                }
            }

            previousLineWasText = true;
        }

        
    });
    
    // console.log(donnees);
    return donnees;
}

export const createManyChapitre = async (req, res) => {
    try {
        const filePath = './maquette_fr.docx';
        const filePathEn = './maquette_en.docx';
        const matieres = await Matiere.find({}).select('_id libelleFr');
        const donnees = await lireDonneesFichierWord(matieres,filePath, filePathEn);

        // Insérer les chapitres dans la base de données
        const result = await Chapitre.insertMany(donnees);

        // Mettre à jour chaque matière avec les ObjectIds des chapitres créés
        for (const chapitre of result) {
            await Matiere.findByIdAndUpdate(chapitre.matiere, { $push: { chapitres: chapitre._id } });
        }

        

        res.status(201).json({ success: true, message: "Ajouté avec succès", data: result });
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, message: "Erreur lors de l'ajout des chapitres", error: e.message });
    }
}

export const addStatut = async (req, res) => {
    try {
      // Mettre à jour tous les libelleFr et libelleEn en retirant les espaces en début et en fin
      const chapitres = await Chapitre.find({});

      // Parcourir chaque objectif pour mettre à jour les libelles
      for (let chapitre of chapitres) {
       
  
        await Chapitre.updateOne(
          { _id: chapitre._id },
          {
            $set: {
                etat:0,
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
export const readChapitre = async (req, res) => { }


export const readChapitres = async (req, res) => { }


