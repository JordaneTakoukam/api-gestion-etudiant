import Devoir from '../../models/devoirs/devoir.model.js'
import Question from '../../models/devoirs/question.model.js'
import Reponse from '../../models/devoirs/reponse.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';

export const createDevoir = async (req, res) => {
    const {
        titreFr,
        titreEn,
        descriptionFr,
        descriptionEn,
        niveau,
        noteSur,
        utilisateur,
        questions,
        deadline,
        ordreAleatoire,
        tentativesMax,
        feedbackConfig,
        annee
    } = req.body;

    try {
        // Champs obligatoires
        const requiredFields = ['titreFr', 'titreEn', 'niveau', 'noteSur', 'utilisateur', 'deadline', 'annee'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: message.champ_obligatoire,
                });
            }
        }
        console.log(tentativesMax);
        console.log(noteSur);

        // Vérification de la validité des ObjectIds
        if (!mongoose.Types.ObjectId.isValid(niveau) || !mongoose.Types.ObjectId.isValid(utilisateur._id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }
        const newDevoir = new Devoir({
            titreFr,
            titreEn,
            descriptionFr,
            descriptionEn,
            niveau,
            noteSur,
            questions,
            deadline,
            utilisateur:utilisateur._id,
            ordreAleatoire: ordreAleatoire || false,
            tentativesMax: tentativesMax || 1,
            feedbackConfig: feedbackConfig || {
                afficherNoteApresSoumission: false,
                afficherCorrectionApresSoumission: false,
                afficherCorrectionApresDeadline: true,
                afficherNoteApresDeadline: true,
            },
           annee
        });

        const saveDevoir = await newDevoir.save();
        const populatedDevoir = await Devoir.populate(saveDevoir, [
            { path: 'utilisateur', select: '_id nom prenom' },
        ]);

        res.status(201).json({
            success: true,
            message: message.ajouter_avec_success,
            data: populatedDevoir,
        });
    } catch (error) {
        console.error("Erreur lors de la création du devoir :", error);
        res.status(500).json({
            success: false,
            message:message.erreurServeur,
        });
    }
};

export const updateDevoir = async (req, res) => {
    const { id } = req.params;
    const {
        titreFr,
        titreEn,
        descriptionFr,
        descriptionEn,
        niveau,
        noteSur,
        utilisateur,
        questions,
        deadline,
        ordreAleatoire,
        tentativesMax,
        feedbackConfig,
        annee
    } = req.body;

    try {
        // Champs obligatoires
        const requiredFields = ['titreFr', 'titreEn', 'niveau', 'noteSur', 'utilisateur', 'deadline', 'annee'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: message.champ_obligatoire,
                });
            }
        }

        // Vérification de la validité des ObjectIds
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(niveau) 
            || !mongoose.Types.ObjectId.isValid(utilisateur._id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        const updatedDevoir = await Devoir.findById(id);
        if (!updatedDevoir) {
            return res.status(404).json({
                success: false,
                message: message.devoir_non_trouve,
            });
        }
        updatedDevoir.titreFr = titreFr;
        updatedDevoir.titreEn = titreEn;
        updatedDevoir.descriptionFr = descriptionFr;
        updatedDevoir.descriptionEn = descriptionEn;
        updatedDevoir.niveau = niveau;
        updatedDevoir.noteSur = noteSur;
        updatedDevoir.utilisateur = utilisateur._id;
        updatedDevoir.questions = questions;
        updatedDevoir.deadline =  deadline;
        updatedDevoir.ordreAleatoire = ordreAleatoire;
        updatedDevoir.tentativesMax = tentativesMax;
        updatedDevoir.feedbackConfig = feedbackConfig;
        updatedDevoir.annee = annee;

        const saveDevoir = await updatedDevoir.save();
        const populatedDevoir = await Devoir.populate(saveDevoir, [
            { path: 'utilisateur', select: '_id nom prenom' },
        ]);

        res.status(200).json({
            success: true,
            message: message.mis_a_jour,
            data: populatedDevoir,
        });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du devoir :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};

export const deleteDevoir = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérification de l'identifiant
        if (!id) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Récupérer le devoir avant suppression pour vérifier son existence et obtenir les questions associées
        const devoir = await Devoir.findById(id);
        if (!devoir) {
            return res.status(404).json({
                success: false,
                message: message.devoir_non_trouve,
            });
        }

        // Supprimer toutes les questions associées au devoir
        await Question.deleteMany({ devoir: id });

        // Supprimer le devoir
        await Devoir.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: message.supprimer_avec_success,
        });
    } catch (error) {
        console.error("Erreur lors de la suppression du devoir :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};


export const getDevoirsByNiveauPaginated = async (req, res) => {
    const { niveauId } = req.params;
    const { page = 1, pageSize = 10, annee} = req.query;

    try {
        if (!niveauId) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire,
            });
        }

        // Calcul de l'offset pour la pagination
        const skip = (parseInt(page) - 1) * parseInt(pageSize);

        // Récupérer les devoirs triés par `createDate`
        const devoirs = await Devoir.find({ niveau: niveauId, annee: annee })
            .populate({path:'utilisateur', select:'nom prenom'})
            .sort({ createDate: 1 })
            .skip(skip)
            .limit(parseInt(pageSize));

        // Compter le nombre total de devoirs pour la pagination
        const total = await Devoir.countDocuments({ niveau: niveauId, annee:annee });

        res.status(200).json({
            success: true,
            data: {
                devoirs,
                totalItems : total,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(pageSize)),
                pageSize: pageSize
            },
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des devoirs paginés :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

export const getDevoirsByEnseignantPaginated = async (req, res) => {
    const { enseignantId } = req.params;
    const { page = 1, pageSize = 10, annee} = req.query;

    try {
        if (!enseignantId) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire,
            });
        }

        // Calcul de l'offset pour la pagination
        const skip = (parseInt(page) - 1) * parseInt(pageSize);

        // Récupérer les devoirs triés par `createDate`
        const devoirs = await Devoir.find({ utilisateur: enseignantId, annee: annee })
            .populate({path:'utilisateur', select:'nom prenom'})
            .sort({ createDate: 1 })
            .skip(skip)
            .limit(parseInt(pageSize));

        // Compter le nombre total de devoirs pour la pagination
        const total = await Devoir.countDocuments({ utilisateur: enseignantId, annee:annee });

        res.status(200).json({
            success: true,
            data: {
                devoirs,
                totalItems : total,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(pageSize)),
                pageSize: pageSize
            },
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des devoirs paginés :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

export const searchDevoir = async (req, res) => {
    const { langue, searchString } = req.params; // Récupère la chaîne de recherche depuis les paramètres de requête
    let {limit = 5} = req.query;
    limit = parseInt(limit);
    // console.log(searchString);
    try {
        // Construire la requête pour filtrer les devoir
        let query = {
             titreFr: { $regex: `^${searchString}`, $options: 'i' } 
        }
        if(langue!=='fr'){
            query = {
                titreEn: { $regex: `^${searchString}`, $options: 'i' } 
            }
        }

        let devoirs = [];

        if(langue ==='fr'){
            devoirs = await Devoir.find(query)
                .sort({ titreFr: 1 }) 
                .populate({path:'utilisateur', select:'nom prenom'})
                .limit(limit); // Limite à 5 résultats
        }else{
            devoirs = await Devoir.find(query)
                .sort({titreEn: 1 }) 
                .populate({path:'utilisateur', select:'nom prenom'})
                .limit(limit); // Limite à 5 résultats
        }
        

        res.json({
            success: true,
            data: {
                devoirs,
                currentPage: 0,
                totalPages: 1,
                totalItems: devoirs.length,
                pageSize: 10,
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des matières :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue sur le serveur.' });
    }
};

export const searchDevoirByEnseignant = async (req, res) => {
    const {searchString, langue} = req.params;
    let { enseignantId, limit } = req.query;
    limit = parseInt(limit);
    try {
       
        
        // Récupérer les détails de chaque matière à partir des identifiants uniques
        let devoirs = [];
    
        if(langue==='fr'){
            let query = {
                utilisateur:enseignantId,
                titreFr: { $regex: `^${searchString}`, $options: 'i' } 
            }
            devoirs = await Devoir.find(query)
                    .sort({ titreFr: 1 }) 
                    .populate({path:'utilisateur', select:'nom prenom'})
                    .limit(limit);
        }else{
            let query = {
                utilisateur:enseignantId,
                titreEn: { $regex: `^${searchString}`, $options: 'i' } 
            }
            devoirs = await Devoir.find(query)
                    .sort({titreEn: 1 }) 
                    .populate({path:'utilisateur', select:'nom prenom'})
                    .limit(limit); 
        }
            

        res.json({
            success: true,
            data: {
                devoirs,
                currentPage: 0,
                totalPages: 1,
                totalItems: devoirs.length,
                pageSize: 10,
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des matières par niveau :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la récupération des matières par niveau.' });
    }
};

export const voirStatistiquesDevoir = async (req, res) => {
    const { devoirId } = req.params;

    try {
        // Vérifier l'existence du devoir
        const devoir = await Devoir.findById(devoirId);
        if (!devoir) {
            return res.status(404).json({
                success: false,
                message: message.devoir_non_trouve,
            });
        }

        // Récupérer toutes les réponses pour le devoir
        const reponses = await Reponse.find({ devoir: devoirId });

        if (reponses.length === 0) {
            return res.status(404).json({
                success: false,
                message: message.pas_de_tentatives,
            });
        }

        // Calculer les statistiques
        const totalTentatives = reponses.reduce((sum, r) => sum + r.tentative.length, 0);
        const scores = reponses.map((r) => r.meilleureScore);
        const moyenne = scores.reduce((a, b) => a + b, 0) / scores.length;
        const meilleureNote = Math.max(...scores);
        const pireNote = Math.min(...scores);

        res.status(200).json({
            success: true,
            data: {
                totalTentatives,
                moyenne,
                meilleureNote,
                pireNote,
            },
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des statistiques :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};

export const getDevoirStats = async (req, res) => {
    try {
      const { devoirId } = req.params;
  
      // Vérification si le devoir existe
      const devoir = await Devoir.findById(devoirId);
      if (!devoir) {
        return res.status(404).json({ message: message.devoir_non_trouve });
      }
  
      // Récupération des réponses associées au devoir
      const reponses = await Reponse.find({ devoir: devoirId })
        .populate("etudiant", "nom prenom") // Inclure les détails de l'étudiant
        .populate({
          path: "tentative.reponses.question",
          select: "textFr textEn nbPoint options",
        });
  
      // Calcul des statistiques
      const nombreParticipants = reponses.length;
      let meilleureNote = -Infinity;
      let pireNote = Infinity;
      let sommeNotes = 0; // Initialisation pour le calcul de la moyenne
      const etudiants = [];
  
      reponses.forEach((reponse) => {
        const { etudiant, meilleureScore, tentative } = reponse;
  
        // Mettre à jour les statistiques de note
        meilleureNote = Math.max(meilleureNote, meilleureScore);
        pireNote = Math.min(pireNote, meilleureScore);
        sommeNotes += meilleureScore;
  
        // Ajouter l'étudiant à la liste
        etudiants.push({
          etudiant,
          meilleureScore,
          nombreTentatives: tentative.length,
        });
      });
  
      // Calcul de la note moyenne
      const noteMoyenne = nombreParticipants > 0 ? sommeNotes / nombreParticipants : null;
  
      // Résultat structuré
      const stats = {
        devoir: {
          _id: devoir._id,
          titreFr: devoir.titreFr,
          titreEn: devoir.titreEn,
          noteSur: devoir.noteSur,
        },
        nombreParticipants,
        meilleureNote: meilleureNote === -Infinity ? null : meilleureNote,
        pireNote: pireNote === Infinity ? null : pireNote,
        noteMoyenne,
        etudiants,
      };
      return res.status(200).json(stats);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
};

export const searchStudentStatsByName = async (req, res) => {
    try {
      const { devoirId, searchString } = req.params; // ID du devoir
  
      // Vérification si le devoir existe
      const devoir = await Devoir.findById(devoirId);
      if (!devoir) {
        return res.status(404).json({
          message: message.devoir_non_trouve,
        });
      }
  
      // Récupération des réponses associées au devoir
      const reponses = await Reponse.find({ devoir: devoirId })
        .populate("etudiant", "nom prenom") // Inclure les détails de l'étudiant
        .populate({
          path: "tentative.reponses.question",
          select: "textFr textEn nbPoint options",
        });
  
      // Filtrer les réponses en fonction du nom ou prénom de l'étudiant
      const filteredResponses = reponses.filter(({ etudiant }) => {
        const fullName = `${etudiant.nom} ${etudiant.prenom}`.toLowerCase();
        return fullName.includes(searchString?.toLowerCase());
      });
  
    //   Vérification si des étudiants correspondent à la recherche
      
  
      // Transformation des données pour correspondre au format attendu
      const studentStats = filteredResponses.map((reponse) => {
        const { etudiant, meilleureScore, tentative } = reponse;
        return {
          etudiant: {
            _id: etudiant._id,
            nom: etudiant.nom,
            prenom: etudiant.prenom,
          },
          meilleureScore,
          nombreTentatives: tentative.length,
        };
      });
      
      // Retourner la liste des statistiques des étudiants
      return res.status(200).json(studentStats);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: message.erreurServeur,
      });
    }
  };
  
  
  
  




