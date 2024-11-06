import Periode from '../../models/periode.model.js';
import Matiere from '../../models/matiere.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import moment from 'moment';
import Setting from '../../models/setting.model.js';
import { formatDateFr, formatNameSurname, formatYear, generatePDFAndSendToBrowser, loadHTML, premierElement } from '../../fonctions/fonctions.js';
import cheerio from 'cheerio';
import ExcelJS from 'exceljs';

// Définir la locale française pour moment
moment.locale('fr');

//jours de la semaine
const jours = [
    { libelleFr: 'Lundi', libelleEn: 'Monday' },
    { libelleFr: 'Mardi', libelleEn: 'Tuesday' },
    { libelleFr: 'Mercredi', libelleEn: 'Wednesday' },
    { libelleFr: 'Jeudi', libelleEn: 'Thursday' },
    { libelleFr: 'Vendredi', libelleEn: 'Friday' },
    { libelleFr: 'Samedi', libelleEn: 'Saturday' },
    { libelleFr: 'Dimanche', libelleEn: 'Sunday' },
];

// create
export const createPeriode = async (req, res) => {
    const {
        jour,
        semestre,
        annee,
        niveau,
        enseignements,
        pause,
        heureDebut,
        heureFin
    } = req.body;

    try {
        // Validation des champs requis
        const requiredFields = pause 
            ? ['jour', 'semestre', 'annee', 'niveau', 'heureDebut', 'heureFin'] 
            : ['jour', 'semestre', 'annee', 'niveau', 'enseignements', 'heureDebut', 'heureFin'];

        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: message.champ_obligatoire,
                });
            }
        }

        // Validation des ObjectIDs
        const validateArrayIds = (array, messageKey) => {
            for (const item of array) {
                const id = item._id || item;  // Support both arrays of objects or IDs
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return res.status(400).json({
                        success: false,
                        message: message[messageKey],
                    });
                }
            }
        };

        const validateObjectId = (id, messageKey) => {
            if (id && !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: message[messageKey],
                });
            }
        };

        if (!pause) {
            enseignements.forEach(matiere => {
                
                // Validation des identifiants des enseignants principaux et suppléants
                validateObjectId(matiere.enseignantPrincipal._id, 'identifiant_invalide');
                if (matiere.enseignantSuppleant) {
                    validateObjectId(matiere.enseignantSuppleant._id, 'identifiant_invalide');
                }
                validateObjectId(matiere.salleCours, 'identifiant_invalide');
                validateObjectId(matiere.typeEnseignement, 'identifiant_invalide');
            });
        }

        // Validation des heures
        const heureRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!heureRegex.test(heureDebut) || !heureRegex.test(heureFin)) {
            return res.status(400).json({
                success: false,
                message: message.heure_invalide,
            });
        }

        // Convertir les heures en minutes pour faciliter la comparaison
        const convertToMinutes = (time) => {
            const [hours, minutes] = time.split(':');
            return parseInt(hours) * 60 + parseInt(minutes);
        };

        const startMinutes = convertToMinutes(heureDebut);
        const endMinutes = convertToMinutes(heureFin);

        // Vérifier si l'heure de début est avant l'heure de fin
        if (startMinutes >= endMinutes) {
            return res.status(400).json({
                success: false,
                message: message.heure_debut_fin_invalides,
            });
        }

        // Vérifier les conflits pour les enseignants et les salles
        const checkConflicts = async () => {
            const conflictingPeriodes = await Periode.find({
                jour,
                semestre,
                annee,
                $or: [
                    {
                        heureDebut: { $lt: heureFin },
                        heureFin: { $gt: heureDebut }
                    }
                ]
            });

            // Vérifier les conflits pour les enseignants principaux et suppléants
            for (const matiere of enseignements) {
                const allEnseignants = [matiere.enseignantPrincipal, matiere.enseignantSuppleant].filter(Boolean); // On garde que les enseignants définis
                for (const enseignant of allEnseignants) {
                    const enseignantConflict = conflictingPeriodes.some(periode => 
                        periode.enseignements.some(m => 
                            m.enseignantPrincipal.toString() === enseignant.toString() ||
                            (m.enseignantSuppleant && m.enseignantSuppleant.toString() === enseignant.toString())
                        )
                    );
                    if (enseignantConflict) {
                        return { conflict: true, type: 'enseignant' };
                    }
                }
            }

            // Vérifier les conflits pour les salles
            for (const matiere of enseignements) {
                const salleConflict = conflictingPeriodes.some(periode => 
                    periode.enseignements.some(m => m.salleCours.toString() === matiere.salleCours.toString())
                );
                if (salleConflict) {
                    return { conflict: true, type: 'salle' };
                }
            }

            return { conflict: false };
        };

        // const conflictCheckResult = await checkConflicts();
        // if (conflictCheckResult.conflict) {
        //     return res.status(400).json({
        //         success: false,
        //         message: conflictCheckResult.type === 'enseignant' ? message.existe_enseignant_cours : message.existe_salle_cours_programme,
        //     });
        // }

        let existingPeriode = await Periode.findOne({ annee, semestre, niveau, jour, heureDebut, heureFin });
        if (existingPeriode) {            
           // Ajouter de nouvelles matières sans doublons
            if (enseignements && enseignements.length > 0) {
                // Vérifier si les matières sont déjà présentes, sinon les ajouter sans doublons
                const updatedEnseignements = [...existingPeriode.enseignements];
                
                enseignements.forEach((newEnseignement) => {
                    // Vérification par rapport à l'ID de la matière
                    const alreadyExists = updatedEnseignements.some(enseignement => enseignement.matiere._id.toString() === newEnseignement.matiere._id.toString());                    
                    if (!alreadyExists) {
                        updatedEnseignements.push(newEnseignement);
                    }
                });
                existingPeriode.enseignements = updatedEnseignements;
            }

            const updatedPeriode = await existingPeriode.save();
            const populatedPeriode = await Periode.populate(updatedPeriode, [
                { path: 'enseignements.matiere', select: '_id code libelleFr libelleEn' },
                { path: 'enseignements.enseignantPrincipal', select: '_id nom prenom' },
                { path: 'enseignements.enseignantSuppleant', select: '_id nom prenom' },
            ]);


            return res.status(200).json({
                success: true,
                message: message.ajouter_avec_success,
                data: populatedPeriode
            });
        } else {
             // Création de la période
            const newPeriodeCours = new Periode({
                jour, semestre, annee, pause, niveau, enseignements, heureDebut, heureFin
            });

            const savedPeriode = await newPeriodeCours.save();
            const populatedPeriode = await Periode.populate(savedPeriode, [
                { path: 'enseignements.matiere', select: '_id code libelleFr libelleEn' },
                { path: 'enseignements.enseignantPrincipal', select: '_id nom prenom' },
                { path: 'enseignements.enseignantSuppleant', select: '_id nom prenom' },
            ]);

            return res.status(201).json({
                success: true,
                message: message.ajouter_avec_success,
                data: populatedPeriode
            });
        }

       

    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la période de cours :', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

// update
export const updatePeriode = async (req, res) => {
    const {periodeId} = req.params;
    const {
        jour,
        semestre,
        annee,
        niveau,
        enseignements,
        heureDebut,
        heureFin,
        pause
    } = req.body;

    try {
        // Vérifier l'existence de l'ID de la période
        if (!mongoose.Types.ObjectId.isValid(periodeId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }
        // Validation des champs requis
        const requiredFields = pause 
            ? ['jour', 'semestre', 'annee', 'niveau', 'heureDebut', 'heureFin'] 
            : ['jour', 'semestre', 'annee', 'niveau', 'enseignements', 'heureDebut', 'heureFin'];

        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: message.champ_obligatoire,
                });
            }
        }

        // Validation des ObjectIDs
        const validateArrayIds = (array, messageKey) => {
            for (const item of array) {
                const id = item._id || item;  // Support both arrays of objects or IDs
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return res.status(400).json({
                        success: false,
                        message: message[messageKey],
                    });
                }
            }
        };

        const validateObjectId = (id, messageKey) => {
            if (id && !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: message[messageKey],
                });
            }
        };

        if (!pause) {
            enseignements.forEach(enseignement => {
                
                // Validation des identifiants des enseignants principaux et suppléants
                validateObjectId(enseignement.enseignantPrincipal._id, 'identifiant_invalide');
                if (enseignement.enseignantSuppleant) {
                    validateObjectId(enseignement.enseignantSuppleant._id, 'identifiant_invalide');
                }
                validateObjectId(enseignement.salleCours, 'identifiant_invalide');
                validateObjectId(enseignement.typeEnseignement, 'identifiant_invalide');
            });
        }

        // Validation des heures
        const heureRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!heureRegex.test(heureDebut) || !heureRegex.test(heureFin)) {
            return res.status(400).json({
                success: false,
                message: message.heure_invalide,
            });
        }

        // Convertir les heures en minutes pour faciliter la comparaison
        const convertToMinutes = (time) => {
            const [hours, minutes] = time.split(':');
            return parseInt(hours) * 60 + parseInt(minutes);
        };

        const startMinutes = convertToMinutes(heureDebut);
        const endMinutes = convertToMinutes(heureFin);

        // Vérifier si l'heure de début est avant l'heure de fin
        if (startMinutes >= endMinutes) {
            return res.status(400).json({
                success: false,
                message: message.heure_debut_fin_invalides,
            });
        }


         // Vérifier les conflits pour les enseignants et les salles
         const checkConflicts = async () => {
            const conflictingPeriodes = await Periode.find({
                jour,
                semestre,
                annee,
                _id: { $ne : periodeId },
                $or: [
                    {
                        heureDebut: { $lt: heureFin },
                        heureFin: { $gt: heureDebut }
                    }
                ]
            });

            // Vérifier les conflits pour les enseignants principaux et suppléants
            for (const enseignement of enseignements) {
                const allEnseignants = [enseignement.enseignantPrincipal, enseignement.enseignantSuppleant].filter(Boolean); // On garde que les enseignants définis
                for (const enseignant of allEnseignants) {
                    const enseignantConflict = conflictingPeriodes.some(periode => 
                        periode.enseignements.some(m => 
                            m.enseignantPrincipal.toString() === enseignant.toString() ||
                            (m.enseignantSuppleant && m.enseignantSuppleant.toString() === enseignant.toString())
                        )
                    );
                    if (enseignantConflict) {
                        return { conflict: true, type: 'enseignant' };
                    }
                }
            }

            // Vérifier les conflits pour les salles
            for (const enseignement of enseignements) {
                const salleConflict = conflictingPeriodes.some(periode => 
                    periode.enseignements.some(e => e.salleCours.toString() === enseignement.salleCours.toString())
                );
                if (salleConflict) {
                    return { conflict: true, type: 'salle' };
                }
            }

            return { conflict: false };
        };

        const conflictCheckResult = await checkConflicts();
        if (conflictCheckResult.conflict) {
            return res.status(400).json({
                success: false,
                message: conflictCheckResult.type === 'enseignant' ? message.existe_enseignant_cours : message.existe_salle_cours_programme,
            });
        }

        

        // Mise à jour de la période existante
        let existingPeriode = await Periode.findById(periodeId);
        if (!existingPeriode) {
            return res.status(404).json({
                success: false,
                message: message.periode_non_trouve,
            });
        }

        existingPeriode.jour = jour;
        existingPeriode.semestre = semestre;
        existingPeriode.annee = annee;
        existingPeriode.niveau = niveau;
        existingPeriode.enseignements = enseignements;
        existingPeriode.heureDebut = heureDebut;
        existingPeriode.heureFin = heureFin;
        existingPeriode.pause = pause;

        // Sauvegarde des modifications
        const updatedPeriode = await existingPeriode.save();
        const populatedPeriode = await Periode.populate(updatedPeriode, [
            { path: 'enseignements.matiere', select: '_id code libelleFr libelleEn' },
            { path: 'enseignements.enseignantPrincipal', select: '_id nom prenom' },
            { path: 'enseignements.enseignantSuppleant', select: '_id nom prenom' },
        ]);

        return res.status(200).json({
            success: true,
            message: message.mis_a_jour,
            data: populatedPeriode
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la période de cours :', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};


export const deletePeriode = async (req, res) => {
    const { periodeId } = req.params;
    const { matiereIndex } = req.query; // On reçoit l'index de la matière à supprimer

    try {
        // Vérifier si la période existe
        const periode = await Periode.findById(periodeId);
        if (!periode) {
            return res.status(404).json({
                success: false,
                message: message.periode_non_trouve,
            });
        }

        // Si la période est une pause ou si elle ne contient qu'une seule matière, supprimer la période
        if (periode.pause || periode.enseignements.length === 1) {
            await Periode.findByIdAndDelete(periodeId);
            return res.status(200).json({
                success: true,
                message: message.supprimer_avec_success,
            });
        }

        // Vérifier que l'index de la matière est valide
        if (matiereIndex < 0 || matiereIndex >= periode.enseignements.length) {
            return res.status(400).json({
                success: false,
                message: message.matiere_non_trouvee,
            });
        }

        // Supprimer la matière en fonction de l'index
        periode.enseignements.splice(matiereIndex, 1);

        // Sauvegarder la période mise à jour
        const updatedPeriode = await periode.save();
        const populatedPeriode = await Periode.populate(updatedPeriode, [
            { path: 'enseignements.matiere', select: '_id code libelleFr libelleEn' },
            { path: 'enseignements.enseignantPrincipal', select: '_id nom prenom' },
            { path: 'enseignements.enseignantSuppleant', select: '_id nom prenom' },
        ]);
        return res.status(200).json({
            success: true,
            message: message.supprimer_avec_success,
            data: populatedPeriode,
        });

    } catch (error) {
        console.error('Erreur lors de la suppression de la matière :', error);
        return res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};



export const getPeriodesByNiveau = async (req, res) => {
    const { niveauId } = req.params;
    const { annee, semestre, page = 1, pageSize = 10 } = req.query; // Pagination ajoutée

    try {
        // Vérifier si l'ID du niveau est valide
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({ 
                success: false, 
                message: message.identifiant_invalide,
            });
        }

        // Création du filtre initial pour le niveau
        const filter = { niveau: niveauId };

        // Si une année est spécifiée dans la requête, l'utiliser
        if (annee && !isNaN(annee)) {
            filter.annee = parseInt(annee);
        }

        // Si un semestre est spécifié dans la requête, l'utiliser
        if (semestre && !isNaN(semestre)) {
            filter.semestre = parseInt(semestre);
        }

        // Calcul de l'index pour la pagination
        const skip = (page - 1) * pageSize;

        // Rechercher les périodes en fonction du filtre et ajouter la pagination
        const periodes = await Periode.find(filter)
            .skip(skip)
            .limit(Number(pageSize))  // Limite le nombre de résultats par page
            .populate({
                path: 'enseignements.matiere',  // Peupler la matière à partir de enseignements.matiere
                select: '_id code libelleFr libelleEn typesEnseignement'  // Sélectionner les champs nécessaires
            })
            .populate({
                path: 'enseignements.enseignantPrincipal',  // Peupler l'enseignant principal
                select: '_id nom prenom'
            })
            .populate({
                path: 'enseignements.enseignantSuppleant',  // Peupler l'enseignant suppléant
                select: '_id nom prenom'
            }).exec();

        // Compter le nombre total de périodes correspondant aux filtres
        const totalItems = await Periode.countDocuments(filter).exec();
        const totalPages = Math.ceil(totalItems / pageSize);

        // Envoyer la réponse avec les données
        res.status(200).json({ 
            success: true,
            data: {
                periodes,
                currentPage: page,
                totalPages,
                totalItems,
                pageSize: Number(pageSize)
            }
        });
    } catch (error) {
        // Gérer les erreurs
        console.error('Erreur lors de la récupération des périodes par niveau :', error);
        res.status(500).json({ 
            success: false, 
            message: message.erreurServeur 
        });
    }
}


export const getPeriodesAVenirByNiveau = async (req, res) => {
    const { niveauId } = req.params;
    const { nbElement = 5, annee = 2023, semestre = 1 } = req.query;
    
    try {
        // Récupérer toutes les périodes de cours pour le niveau spécifié
       // Création du filtre initial pour le niveau
       const filter = { niveau: niveauId };

       // Si une année est spécifiée dans la requête, l'utiliser
       if (annee && !isNaN(annee)) {
           filter.annee = parseInt(annee);
       }

       // Si un semestre est spécifié dans la requête, l'utiliser
       if (semestre && !isNaN(semestre)) {
           filter.semestre = parseInt(semestre);
       }


       // Rechercher les périodes en fonction du filtre
       const periodes = await Periode.find(filter)
           .populate({
               path: 'enseignements.matiere',
               select: 'code libelleFr libelleEn'
           })
           .populate({
               path: 'enseignements.enseignantPrincipal',
               select: 'nom prenom'
           })
           .populate({
               path: 'enseignements.enseignantSuppleant',
               select: 'nom prenom'
           })
           .exec();
           

        // Déterminer le jour actuel
        const now = new Date();
        const currentDayIndex = now.getDay(); // 0 pour dimanche, 1 pour lundi, ..., 6 pour samedi

        // Diviser les périodes en groupes par jour de la semaine
        const periodesParJour = {};
        for (let i = 0; i < 7; i++) {
            periodesParJour[i] = [];
        }
        periodes.forEach(periode => {
            const [heure, minutes] = periode.heureDebut.split(':');
            const heureDebut = new Date();
            heureDebut.setHours(parseInt(heure));
            heureDebut.setMinutes(parseInt(minutes));
            const jourIndex = periode.jour == 1 ? 1 :
                periode.jour == 2 ? 2 :
                periode.jour == 3 ? 3 :
                periode.jour == 4 ? 4 :
                periode.jour == 5 ? 5 :
                periode.jour == 6 ? 6 :
                0; // Dimanche
            
                 // Vérifier si l'heure de début est déjà passée
                if (heureDebut <= now) {
                    // Si l'heure de début est passée, ajoutez la période à la fin de la liste
                    periodesParJour[jourIndex].push(periode);
                } else {
                    // Sinon, ajoutez-la au début de la liste
                    periodesParJour[jourIndex].unshift(periode);
                }
            
        });
        // Concaténer les groupes de périodes dans l'ordre de la semaine, en commençant par le jour actuel
        let periodesAVenir = [];
        let periodesJourCourantDejaPasse = [];
        periodesParJour[currentDayIndex].forEach(periode => {
            const [heure, minutes] = periode.heureDebut.split(':');
            const heureDebut = new Date();
            heureDebut.setHours(parseInt(heure));
            heureDebut.setMinutes(parseInt(minutes));
            
            // Vérifier si l'heure de début est déjà passée
            if (heureDebut <= now) {
                // Si oui, ajouter la période à la liste periodesJourCourantDejaPasse
                periodesJourCourantDejaPasse.push(periode);
            } else {
                // Sinon, ajouter la période à la liste periodesAVenir
                periodesAVenir.push(periode);
            }
        });
        
        for (let i = currentDayIndex+1; i <= 6; i++) {
            periodesAVenir = periodesAVenir.concat(periodesParJour[i]);
        }
        for (let i = 0; i < currentDayIndex; i++) {
            periodesAVenir = periodesAVenir.concat(periodesParJour[i]);
        }
        periodesAVenir = periodesAVenir.concat(periodesJourCourantDejaPasse);
        
        // Filtrer les périodes null
        periodesAVenir = periodesAVenir.filter(periode => periode !== null);
        
        // Limiter le nombre de périodes à renvoyer
        const periodesAVenirLimitees = periodesAVenir.slice(0, nbElement);
        
        res.status(200).json({ 
            success: true,
            data: { periodes: periodesAVenirLimitees }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des périodes de cours à venir pour le niveau :', error);
        res.status(500).json({ 
            success: false,
            message: 'Une erreur est survenue lors de la récupération des périodes de cours à venir.'
        });
    }
}


export const getPeriodesAVenirByEnseignant = async (req, res) => {
    const { enseignantId } = req.params;
    const { nbElement = 5, annee = 2023, semestre = 1 } = req.query;

    try {
        // Filtre pour récupérer les périodes associées à l'enseignant
        const filter = {
            $or: [
                { enseignantsPrincipaux: enseignantId },
                { enseignantsSuppleants: enseignantId }
            ],
            annee: parseInt(annee),
            semestre: parseInt(semestre)
        };

        // Récupérer les périodes de cours en fonction du filtre
        const periodes = await Periode.find(filter)
            .populate({
                path: 'enseignements.matiere',
                select: 'code libelleFr libelleEn'
            })
            .populate({
                path: 'enseignements.enseignantPrincipal',
                select: 'nom prenom'
            })
            .populate({
                path: 'enseignements.enseignantSuppleant',
                select: 'nom prenom'
            })
            .exec();

        // Obtenir l'heure et le jour actuels
        const now = new Date();
        const currentDayIndex = now.getDay(); // 0 pour dimanche, 1 pour lundi, ..., 6 pour samedi

        // Diviser les périodes par jour de la semaine
        const periodesParJour = Array(7).fill([]); // Tableau avec 7 jours

        periodes.forEach(periode => {
            // Vérifier si l'enseignant est dans les enseignantsPrincipaux ou enseignantsSuppleants
            const matieresFiltrees = periode.enseignements.filter(e => {
                const enseignantPrincipal = e.enseignantPrincipal?._id.toString() === enseignantId;
                const enseignantSuppleant = e.enseignantSuppleant?._id.toString() === enseignantId;
                
                return enseignantPrincipal || enseignantSuppleant;
            });

            if(matieresFiltrees.length>0){
                periode.matieres = matieresFiltrees; // Ne conserver que les matières de l'enseignant
                // Conversion de l'heure de début en objet Date pour la comparaison
                const [heureDebutStr, minuteDebutStr] = periode.heureDebut.split(':');
                const heureDebut = new Date();
                heureDebut.setHours(parseInt(heureDebutStr));
                heureDebut.setMinutes(parseInt(minuteDebutStr));

                // Utiliser l'index du jour (0 = dimanche, 1 = lundi, etc.)
                const jourIndex = periode.jour % 7; // Assurer que dimanche = 0 et samedi = 6

                // Ajouter la période au bon jour
                periodesParJour[jourIndex] = [...periodesParJour[jourIndex], periode];
            }

        });

        // Trier les périodes du jour courant
        let periodesAVenir = [];
        const periodesJourCourant = periodesParJour[currentDayIndex];

        const periodesJourCourantDejaPasse = periodesJourCourant.filter(periode => {
            const [heureDebutStr, minuteDebutStr] = periode.heureDebut.split(':');
            const heureDebut = new Date();
            heureDebut.setHours(parseInt(heureDebutStr));
            heureDebut.setMinutes(parseInt(minuteDebutStr));

            return heureDebut <= now;
        });

        const periodesJourCourantAVenir = periodesJourCourant.filter(periode => {
            const [heureDebutStr, minuteDebutStr] = periode.heureDebut.split(':');
            const heureDebut = new Date();
            heureDebut.setHours(parseInt(heureDebutStr));
            heureDebut.setMinutes(parseInt(minuteDebutStr));

            return heureDebut > now;
        });

        // Ajouter d'abord les périodes à venir du jour actuel
        periodesAVenir = [...periodesJourCourantAVenir];

        // Ajouter les périodes des jours suivants
        for (let i = currentDayIndex + 1; i <= 6; i++) {
            periodesAVenir = periodesAVenir.concat(periodesParJour[i]);
        }

        // Ajouter les périodes des jours précédents
        for (let i = 0; i < currentDayIndex; i++) {
            periodesAVenir = periodesAVenir.concat(periodesParJour[i]);
        }

        // Ajouter les périodes déjà passées du jour courant en dernier
        periodesAVenir = periodesAVenir.concat(periodesJourCourantDejaPasse);
        

        // Limiter le nombre de périodes à renvoyer
        const periodesAVenirLimitees = periodesAVenir.slice(0, nbElement);
        // Renvoyer les périodes à venir
        res.status(200).json({
            success: true,
            data: { periodes: periodesAVenirLimitees }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des périodes de cours à venir pour l\'enseignant :', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de la récupération des périodes de cours à venir.'
        });
    }
};

export const generateEmploisDuTemps = async (req, res) => {
    const {  annee, semestre } = req.params;
    const {section, cycle, niveau, langue, fileType} = req.query;

    // Vérifier si l'ID du niveau est valide
    if (!mongoose.Types.ObjectId.isValid(niveau._id)) {
        return res.status(400).json({ 
            success: false, 
            message: message.identifiant_invalide,
        });
    }

    // Création du filtre initial pour le niveau
    const filter = { niveau: niveau._id };

    // Si une année est spécifiée dans la requête, l'utiliser
    if (annee && !isNaN(annee)) {
        filter.annee = parseInt(annee);
    }

    // Si un semestre est spécifié dans la requête, l'utiliser
    if (semestre && !isNaN(semestre)) {
        filter.semestre = parseInt(semestre);
    }


    // Rechercher les périodes en fonction du filtre
    const periodes = await Periode.find(filter)
        .populate({
            path: 'enseignements.matiere',
            select: 'code libelleFr libelleEn'
        })
        .populate({
            path: 'enseignements.enseignantPrincipal',
            select: 'nom prenom'
        })
        .populate({
            path: 'enseignements.enseignantSuppleant',
            select: 'nom prenom'
        })
        .exec();
    if(fileType.toLowerCase() === 'pdf'){
        let filePath= './templates/templates_fr/template_emplois_temps_fr.html';
        if(langue==='en'){
            filePath='./templates/templates_en/template_emplois_temps_en.html'
        }
        // Remplir le template avec les données récupérées
        const htmlContent = await fillTemplateEmplois(langue, section, cycle, niveau, periodes, filePath, annee, semestre);

        // Générer le PDF à partir du contenu HTML
        generatePDFAndSendToBrowser(htmlContent, res, 'landscape');
    }else{
        exportToExcel(res, periodes, langue);
    }
}


const exportToExcel = async (res, periodes, langue) => {
    
    if (periodes) {
        let settings = await Setting.find().select('sallesDeCours');
        let setting = null;
        if(settings.length>0){
            setting=settings[0]
        }
        
        // Créer un nouveau classeur Excel
        const workbook = new ExcelJS.Workbook();
        // Ajouter une nouvelle feuille de calcul
        const worksheet = workbook.addWorksheet('Sheet1');

        // Déterminer le libellé de l'entête "Horaire" en fonction de la langue
        const headerTimeLabel = langue === 'fr' ? 'Horaire' : 'Time';

        // Ajouter l'entête (Horaire/Time et les jours de la semaine)
        worksheet.addRow([headerTimeLabel, ...jours.map(jour => langue === 'fr' ? jour.libelleFr : jour.libelleEn)]);

        // Créer un dictionnaire pour organiser les cours par jour et heure
        const coursParJourEtHeure = {};
        periodes.forEach(periode => {
            
            const jourLabel = jours[periode.jour - 1];  // Convertir l'index du jour en libellé
            const heure = `${periode.heureDebut} - ${periode.heureFin}`;
            
            // Créer une clé unique pour chaque horaire
            if (!coursParJourEtHeure[heure]) {
                coursParJourEtHeure[heure] = {};
            }
            
            // Déterminer le libellé du jour en fonction de la langue
            const jourKey = langue === 'fr' ? jourLabel.libelleFr : jourLabel.libelleEn;
            
            // Itération sur les salles de cours et ajout de leurs libellés
            const sallesLibelle = periode.enseignements && periode.enseignements.length > 0 
            ? [...new Set(periode.enseignements.map(e => setting?.sallesDeCours.find(sc => sc._id.toString() === e.salleCours.toString())?.[langue === 'fr' ? 'libelleFr' : 'libelleEn'] || ''))]
                .filter(libelle => libelle) // Filtrer les valeurs vides ou nulles
                .join('/ ')
            : '';
            
            
            // Itération sur les enseignants principaux
            const enseignantsLibelle = periode.enseignements && periode.enseignements.length > 0
            ? periode.enseignements.map((e, index) => {
                const suppleant = periode.enseignements && periode.enseignements[index] && periode.enseignements[index].enseignantSuppleant; // Suppléant correspondant à l'index
                const principalLibelle = `${premierElement(e.enseignantPrincipal.nom)} ${e.enseignantPrincipal.prenom ? premierElement(e.enseignantPrincipal.prenom) : ""}`;
                const suppleantLibelle = suppleant ? `${premierElement(suppleant.nom)} ${suppleant.prenom ? premierElement(suppleant.prenom) : ""}` : "-";
                return `${principalLibelle}/${suppleantLibelle}`;
            }).join(', ')
            : "-";
            
            
            // Itération sur les matières
            const matieresLibelle = periode.enseignements && periode.enseignements.length > 0
                ? periode.enseignements.map(e => langue === 'fr' ? e.matiere.libelleFr : e.matiere.libelleEn).join('/ ')
                : "";
            
            // Ajouter le cours à l'horaire correspondant, avec des informations sur des lignes séparées
            if(!periode.pause){
                coursParJourEtHeure[heure][jourKey] = `${matieresLibelle} - (${enseignantsLibelle}) - ${sallesLibelle}`;
            }else{
                const pauseLibelle = periode.pause ? (langue === 'fr' ? 'Pause' : 'Break') : '';
                coursParJourEtHeure[heure][jourKey] = `${pauseLibelle}`;
            }
            
        });

        // Trier les heures par ordre croissant
        const horairesTries = Object.keys(coursParJourEtHeure).sort((a, b) => {
            // Transformer les heures de début en objets Date pour une comparaison facile
            const [startA] = a.split(' - ');
            const [startB] = b.split(' - ');
            return new Date(`1970-01-01T${startA}:00`) - new Date(`1970-01-01T${startB}:00`);
        });

        // Ajouter les périodes de cours au tableau
        horairesTries.forEach(horaire => {
            const coursParJour = coursParJourEtHeure[horaire];
            const row = [horaire]; // Ajouter l'horaire à la première colonne
            jours.forEach(jour => {
                const jourLabel = langue === 'fr' ? jour.libelleFr : jour.libelleEn;
                row.push(coursParJour[jourLabel] || ''); // Ajouter la matière ou une cellule vide si aucun cours
            });
            worksheet.addRow(row);
        });

        // Définir les en-têtes de réponse pour le téléchargement du fichier
        res.setHeader('Content-Disposition', `attachment; filename=emploi_du_temps_ ${langue}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Envoyer le fichier Excel en réponse
        await workbook.xlsx.write(res);
        res.end(); // Terminer la réponse après l'écriture du fichier
    } else {
        res.status(400).json({ success: false, message: message.pas_de_donnees });
    }
};


function getUniqueTimeSlots(periodes) {
    const timeSlots = new Set();
    periodes.forEach(periode => {
        const slot = `${periode.heureDebut}-${periode.heureFin}`;
        timeSlots.add(slot);
    });
    return Array.from(timeSlots).sort();
}

async function fillTemplateEmplois(langue, section, cycle, niveau, periodes, filePath, annee, semestre) {
    try {
        const htmlString = await loadHTML(filePath);
        const $ = cheerio.load(htmlString); // Charger le template HTML avec cheerio
        
        const body = $('body');
        
        body.find('#section').text(langue==='fr'?section.libelleFr:section.libelleEn+" "+cycle.code+""+niveau.code);
        body.find('#semestre').text(semestre);
        body.find('#cycle-niveau').text(cycle.code+""+niveau.code);
        body.find('#annee').text(formatYear(parseInt(annee)));
        const tbody = $('#table-emplois tbody');
        
        const timeSlots = getUniqueTimeSlots(periodes);
        
        timeSlots.forEach(slot => {
            const [startTime, endTime] = slot.split('-');
            const row = $('<tr></tr>');
            row.append(`<td>${startTime} - ${endTime}</td>`);
            
            for (let day = 1; day <= 7; day++) {
                const cell = $(`<td class="time-slot" data-time="${slot}" data-day="${day}"></td>`);
                row.append(cell);
            }
            
            tbody.append(row);
        });
        
        let settings = await Setting.find().select('sallesDeCours typesEnseignement');
        let setting = null;
        if(settings.length>0){
            setting=settings[0]
        }
        
        periodes.forEach(periode => {
            const slot = `${periode.heureDebut}-${periode.heureFin}`;
            const timeSlot = $(`.time-slot[data-time="${slot}"][data-day="${periode.jour}"]`);
            if(!periode.pause){
                if (timeSlot.length > 0) {
                     // Itération sur les salles de cours et ajout de leurs libellés
                    const sallesLibelle = periode.enseignements && periode.enseignements.length > 0 
                    ? [...new Set(periode.enseignements.map(e => setting?.sallesDeCours.find(sc => sc._id.toString() === e.salleCours.toString())?.[langue === 'fr' ? 'libelleFr' : 'libelleEn'] || ''))]
                        .filter(libelle => libelle) // Filtrer les valeurs vides ou nulles
                        .join('/ ')
                    : '';
                    
                    
                    // Itération sur les enseignants principaux
                    const enseignantsLibelle = periode.enseignements && periode.enseignements.length > 0
                    ? periode.enseignements.map((e, index) => {
                        const suppleant = periode.enseignements && periode.enseignements[index] && periode.enseignements[index].enseignantSuppleant; // Suppléant correspondant à l'index
                        const principalLibelle = `${premierElement(e.enseignantPrincipal.nom)} ${e.enseignantPrincipal.prenom ? premierElement(e.enseignantPrincipal.prenom) : ""}`;
                        const suppleantLibelle = suppleant ? `${premierElement(suppleant.nom)} ${suppleant.prenom ? premierElement(suppleant.prenom) : ""}` : "-";
                        return `${principalLibelle}/${suppleantLibelle}`;
                    }).join(', ')
                    : "-";
                    
                    
                    // Itération sur les matières
                    const matieresLibelle = periode.enseignements && periode.enseignements.length > 0
                        ? periode.enseignements.map(e => langue === 'fr' ? e.matiere.libelleFr : e.matiere.libelleEn).join('/ ')
                        : "";

                    const content = `${matieresLibelle} <br> ${enseignantsLibelle}  <br> ${sallesLibelle}`;
                    timeSlot.append(`<div>${content}</div>`);
                }
            }else{
                if (timeSlot.length > 0) {
                    
                    timeSlot.append(`<div>${langue==='fr'?'PAUSE':'BREAK'}</div>`);
                }
            }
            
        });

        return $.html(); // Récupérer le HTML mis à jour
    } catch (error) {
        console.error('Erreur lors du remplissage du template :', error);
        return '';
    }
}


// read
export const readPeriode = async (req, res) => { }


export const readPeriodes = async (req, res) => { }



