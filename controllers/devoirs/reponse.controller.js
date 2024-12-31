import Devoir from '../../models/devoirs/devoir.model.js'
import Question from '../../models/devoirs/question.model.js'
import Reponse from '../../models/devoirs/reponse.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';

export const soumettreTentative = async (req, res) => {
    const { devoirId } = req.params;
    const { etudiantId, reponses } = req.body;

    try {
        if (!devoirId || !etudiantId || !reponses) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire,
            });
        }

        // Vérifier l'existence du devoir
        const devoir = await Devoir.findById(devoirId);
        if (!devoir) {
            return res.status(404).json({
                success: false,
                message: message.devoir_non_trouve,
            });
        }

        // Rechercher l'entrée de l'étudiant pour ce devoir
        let reponse = await Reponse.findOne({ devoir: devoirId, etudiant: etudiantId });

        // Vérifier si le nombre de tentatives a été atteint
        if (reponse && reponse.tentative.length >= devoir.tentativesMax) {
            return res.status(403).json({
                success: false,
                message: message.tentatives_max_atteintes,
            });
        }

        // Calculer le score pour la tentative
        const questions = await Question.find({ devoir: devoirId });
        const score = questions.reduce((total, question) => {
            // Trouver les réponses associées à la question courante
            const questionResponses = reponses.find((r) => r.question.toString() === question._id.toString());
            console.log(questionResponses)
            if (!questionResponses) return total;
        
            // Calculer le score total pour la question courante
            const questionScore = questionResponses.reponses.reduce((acc, response) => {
              // Trouver l'option correspondante
              const option = question.options.find(
                (opt) => opt.textFr === response || opt.textEn === response
              );

              if (option) {
                return acc + (option.pourcentage / 100) * question.nbPoint;
              }
              
              return acc;
            }, 0);
            // Ajouter le score de la question au score total
            return total + questionScore;
          }, 0);
        

        // Créer une nouvelle réponse si elle n'existe pas encore
        if (!reponse) {
            reponse = new Reponse({
                etudiant: etudiantId,
                devoir: devoirId,
                meilleureScore: 0,
                tentative: [],
            });
        }

        // Ajouter la nouvelle tentative
        const nouvelleTentative = {
            reponses,
            score,
            dateSoumission: new Date(),
        };
        reponse.tentative.push(nouvelleTentative);

        // // Mettre à jour le meilleur score si nécessaire
        if (score > reponse.meilleureScore) {
            reponse.meilleureScore = score;
        }

        await reponse.save();

        res.status(201).json({
            success: true,
            message: message.soumission_reussie,
            data: nouvelleTentative,
        });
    } catch (error) {
        console.error("Erreur lors de la soumission de la tentative :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};

export const obtenirTentativesEtudiant = async (req, res) => {
    try {
      const { devoirId, etudiantId } = req.params;
  
      // Vérification si le devoir existe
      const devoir = await Devoir.findById(devoirId);
      if (!devoir) {
        return res.status(404).json({ message: message.devoir_non_trouve });
      }
  
      // Récupération des réponses de l'étudiant pour le devoir
      const reponse = await Reponse.findOne({ devoir: devoirId, etudiant: etudiantId })
        .populate({
          path: "tentative.reponses.question",
          select: "textFr textEn nbPoint options",
        });
  
      if (!reponse) {
        return res.status(404).json({ message: message.etudiant_tentative_non_trouvee });
      }
  
      // Structuration des données
      const detailsTentatives = reponse.tentative.map((tentative) => ({
        dateSoumission: tentative.dateSoumission,
        score: tentative.score,
        reponses: tentative.reponses.map((rep) => ({
          question: rep.question.textFr,
          reponses: rep.reponses,
        })),
      }));
  
      return res.status(200).json({
        etudiantId: reponse.etudiant,
        devoirId,
        meilleureScore: reponse.meilleureScore,
        tentatives: detailsTentatives,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
};

// export const obtenirTentativesEtudiant = async (req, res) => {
//     const { devoirId, etudiantId } = req.params;

//     try {
//         // Vérifier l'existence du devoir
//         const devoir = await Devoir.findById(devoirId);
//         if (!devoir) {
//             return res.status(404).json({
//                 success: false,
//                 message: message.devoir_non_trouve,
//             });
//         }

//         // Récupérer les tentatives pour l'étudiant et le devoir
//         const reponse = await Reponse.findOne({ devoir: devoirId, etudiant: etudiantId });
//         if (!reponse) {
//             return res.status(404).json({
//                 success: false,
//                 message: message.pas_de_tentatives,
//             });
//         }

//         res.status(200).json({
//             success: true,
//             data: reponse.tentative,
//         });
//     } catch (error) {
//         console.error("Erreur lors de la récupération des tentatives :", error);
//         res.status(500).json({
//             success: false,
//             message: message.erreurServeur,
//         });
//     }
// };
  

