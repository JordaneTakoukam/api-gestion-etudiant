import Presence from '../../models/presence.model.js'
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';
import cheerio from 'cheerio';
import { extractRawText } from 'mammoth';
import ExcelJS from 'exceljs'
import Periode from '../../models/periode.model.js';
import {generatePDFAndSendToBrowser, formatYear, loadHTML, calculGrossBonus, calculIRNC, calculNetBonus} from '../../fonctions/fonctions.js';
import Setting from '../../models/setting.model.js'


export const createPresence = async (req, res) => {
    const { enseignant, matiere,niveau, annee, semestre, jour, heureDebut, heureFin } = req.body;

    try {
        // Vérification des champs obligatoires
        if (!enseignant || !matiere || !niveau || !jour || !heureDebut || !heureFin || !annee || !semestre) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérification de la validité des ObjectIds
        if (!mongoose.Types.ObjectId.isValid(enseignant._id) || !mongoose.Types.ObjectId.isValid(matiere._id) || !mongoose.Types.ObjectId.isValid(niveau)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Création d'une nouvelle présence
        const nouvellePresence = new Presence({
            enseignant:enseignant._id,
            matiere:matiere._id,
            niveau,
            jour,
            heureDebut,
            heureFin,
            annee,
            semestre
        });

        // Enregistrement de la nouvelle présence dans la base de données
        const savePresence = await nouvellePresence.save();

        res.status(200).json({
            success: true,
            message: message.ajouter_avec_success,
            data: savePresence,
        });
    } catch (error) {
        // console.error('Erreur lors de l\'enregistrement de la présence :', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.',
        });
    }
};


export const updatePresence = async (req, res) => {
    const { presenceId } = req.params; // Récupérer l'ID de la présence depuis les paramètres de la requête
    const { enseignant, matiere, niveau, jour, heureDebut, heureFin, annee, semestre } = req.body;

    try {
        // Vérifier si l'ID de la présence est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(presenceId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Vérification des champs obligatoires
        if (!enseignant || !matiere || !niveau || !jour || !heureDebut || !heureFin || !annee || !semestre) {
            return res.status(400).json({
                success: false,
                message: message.champ_obligatoire
            });
        }

        // Vérifier si la présence existe
        const existingPresence = await Presence.findById(presenceId);
        if (!existingPresence) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee
            });
        }

        // Mise à jour de la présence
        existingPresence.enseignant = enseignant;
        existingPresence.matiere = matiere;
        existingPresence.jour = jour;
        existingPresence.heureDebut = heureDebut;
        existingPresence.heureFin = heureFin;
        existingPresence.niveau=niveau;
        existingPresence.annee=annee;
        existingPresence.semestre=semestre;

        // Enregistrer les modifications dans la base de données
        const updatedPresence = await existingPresence.save();

        res.status(200).json({
            success: true,
            message: message.mis_a_jour,
            data: updatedPresence,
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la présence :', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};


export const deletePresence = async (req, res) => {
    const { presenceId } = req.params; // Récupérer l'ID de la présence depuis les paramètres de la requête

    try {
        // Vérifier si l'ID de la présence est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(presenceId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Supprimer la présence par son ID
        const deletedPresence = await Presence.findByIdAndDelete(presenceId);
        if (!deletedPresence) {
            return res.status(404).json({
                success: false,
                message: message.non_trouvee
            });
        }

        res.status(200).json({
            success: true,
            message: message.supprimer_avec_success
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de la présence :', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};


export const getPresencesWithTotalHoraire = async (req, res) => {
    const { niveauId } = req.params;
    const { page = 1, pageSize = 10, annee, semestre } = req.query;
    try {
        const startIndex = (page - 1) * pageSize;

        // Filtre pour l'année, le semestre et le niveau
        const periodeFilter = {};
        if (annee && !isNaN(annee)) {
            periodeFilter.annee = parseInt(annee);
        }
        if (semestre && !isNaN(semestre)) {
            periodeFilter.semestre = parseInt(semestre);
        }
        if (niveauId) {
            periodeFilter.niveau = niveauId;
        }

        // Étape 1: Obtenir tous les enseignants du niveau pour le semestre et l'année
        const periodes = await Periode.find(periodeFilter)
            .select('enseignantPrincipal enseignantSuppleant')
            .populate('enseignantPrincipal enseignantSuppleant', 'nom prenom');

        // Extraire les enseignants principaux et suppléants
        const enseignantsIds = periodes.reduce((acc, periode) => {
            if (periode.enseignantPrincipal) acc.push(periode.enseignantPrincipal._id);
            if (periode.enseignantSuppleant) acc.push(periode.enseignantSuppleant._id);
            return acc;
        }, []);

        // Supprimer les doublons
        const uniqueEnseignantsIds = [...new Set(enseignantsIds)];

        // Vérification des types et conversion en ObjectId si nécessaire
        const filter = { annee: parseInt(annee), semestre: parseInt(semestre) };

        if (mongoose.Types.ObjectId.isValid(niveauId)) {
            filter.niveau = niveauId; // Conversion du niveauId en ObjectId
        } else {
            return res.status(400).json({ success: false, message: "niveauId invalide" });
        }

        // Étape 2: Obtenir les présences des enseignants avec totalHoraire

         // Étape 1 : Récupérer toutes les présences
         const presences = await Presence.find(filter)
         .populate('enseignant', 'nom prenom')
         .exec();

        // Étape 2 : Calculer le totalHoraire pour chaque enseignant
        const enseignantHoraireMap = {};

        presences.forEach(presence => {
            const enseignantId = presence.enseignant._id;
            const heureDebut = parseInt(presence.heureDebut.split(':')[0]);
            const minuteDebut = parseInt(presence.heureDebut.split(':')[1]);
            const heureFin = parseInt(presence.heureFin.split(':')[0]);
            const minuteFin = parseInt(presence.heureFin.split(':')[1]);
    
            // Calculer les heures et minutes de début et de fin en décimales
            const heureDebutDecimal = heureDebut + minuteDebut / 60;
            const heureFinDecimal = heureFin + minuteFin / 60;
    
            // Calculer la différence d'heures entre l'heure de début et l'heure de fin
            let differenceHeures = heureFinDecimal - heureDebutDecimal;
    
            // Si la différence de minutes est négative, ajuster les heures
            if (minuteFin < minuteDebut) {
                differenceHeures -= 1 / 60; // Retirer une heure
            }
        
            if (enseignantHoraireMap[enseignantId]) {
                enseignantHoraireMap[enseignantId].totalHoraire += differenceHeures;
            } else {
                enseignantHoraireMap[enseignantId] = {
                    enseignant: {
                        _id: presence.enseignant._id,
                        nom: presence.enseignant.nom,
                        prenom: presence.enseignant.prenom,
                    },
                    totalHoraire: differenceHeures
                };
            }
        });

        // Étape 3: Combiner les enseignants sans présence avec ceux qui en ont
        const enseignantsPresences = [];

        uniqueEnseignantsIds.forEach(enseignantId => {
            // Chercher la présence de l'enseignant principal
            const presence = enseignantHoraireMap[enseignantId];
            
            if (presence) {
                
                // Si l'enseignant a une présence, on l'ajoute directement
                enseignantsPresences.push(presence);
            } else {
                // Si l'enseignant n'a pas de présence, on le récupère depuis les périodes
                const periodeCorrespondante = periodes.find(p => 
                    (p.enseignantPrincipal && p.enseignantPrincipal._id.equals(enseignantId)) ||
                    (p.enseignantSuppleant && p.enseignantSuppleant._id.equals(enseignantId))
                );

                // Récupération de l'enseignant principal
                if (periodeCorrespondante && periodeCorrespondante.enseignantPrincipal && periodeCorrespondante.enseignantPrincipal._id.equals(enseignantId)) {
                    enseignantsPresences.push({
                        enseignant: {
                            _id: periodeCorrespondante.enseignantPrincipal._id,
                            nom: periodeCorrespondante.enseignantPrincipal.nom,
                            prenom: periodeCorrespondante.enseignantPrincipal.prenom
                        },
                        totalHoraire: 0 // Pas de présence enregistrée
                    });
                }

                // Récupération de l'enseignant suppléant
                if (periodeCorrespondante && periodeCorrespondante.enseignantSuppleant && periodeCorrespondante.enseignantSuppleant._id.equals(enseignantId)) {
                    enseignantsPresences.push({
                        enseignant: {
                            _id: periodeCorrespondante.enseignantSuppleant._id,
                            nom: periodeCorrespondante.enseignantSuppleant.nom,
                            prenom: periodeCorrespondante.enseignantSuppleant.prenom
                        },
                        totalHoraire: 0 // Pas de présence enregistrée
                    });
                }
            }
        });

        // Pagination
        const paginatedEnseignants = enseignantsPresences.slice(startIndex, startIndex + parseInt(pageSize));
        const totalItems = enseignantsPresences.length;
        const totalPages = Math.ceil(totalItems / parseInt(pageSize));

        res.status(200).json({
            success: true,
            data: {
                presencePaies: paginatedEnseignants,
                totalPages: totalPages,
                currentPage: page,
                totalItems: totalItems,
                pageSize: pageSize
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des présences :', error);
        res.status(500).json({ success: false, message: "Erreur du serveur" });
    }
};

export const searchEnseignantPresence = async (req, res) => {
    const { searchString, limit = 5 } = req.query;
    try {
        // Étape 1: Obtenir tous les enseignants du niveau pour le semestre et l'année
        const periodes = await Periode.find({})
            .select('enseignantPrincipal enseignantSuppleant')
            .populate('enseignantPrincipal enseignantSuppleant', 'nom prenom');

        // Filtre les enseignants principaux en fonction de searchString
        const filteredEnseignantsPrincipaux = periodes.filter(periode => {
            return periode.enseignantPrincipal &&
                (periode.enseignantPrincipal.nom.toLowerCase().includes(searchString.toLowerCase()) ||
                 periode.enseignantPrincipal.prenom.toLowerCase().includes(searchString.toLowerCase()));
        });

        // Filtre les enseignants suppléants en fonction de searchString
        const filteredEnseignantsSuppleants = periodes.filter(periode => {
            return periode.enseignantSuppleant &&
                (periode.enseignantSuppleant.nom.toLowerCase().includes(searchString.toLowerCase()) ||
                 periode.enseignantSuppleant.prenom.toLowerCase().includes(searchString.toLowerCase()));
        });

        // Extraire les IDs uniques des enseignants principaux et suppléants filtrés
        const enseignantsPrincipauxIds = filteredEnseignantsPrincipaux.map(periode => periode.enseignantPrincipal._id);
        const enseignantsSuppleantsIds = filteredEnseignantsSuppleants.map(periode => periode.enseignantSuppleant._id);

        // Combiner les résultats tout en supprimant les doublons
        const uniqueEnseignantsIds = [...new Set([...enseignantsPrincipauxIds, ...enseignantsSuppleantsIds])];

        // Étape 2: Obtenir les présences des enseignants avec totalHoraire
        const filter = {
            'enseignant._id': { $in: uniqueEnseignantsIds }
        };

        const presences = await Presence.find(filter)
            .populate('enseignant', 'nom prenom')
            .exec();

        // Étape 3: Calculer le totalHoraire pour chaque enseignant
        const enseignantHoraireMap = {};

        presences.forEach(presence => {
            const enseignantId = presence.enseignant._id;
            const heureDebut = parseInt(presence.heureDebut.split(':')[0]);
            const minuteDebut = parseInt(presence.heureDebut.split(':')[1]);
            const heureFin = parseInt(presence.heureFin.split(':')[0]);
            const minuteFin = parseInt(presence.heureFin.split(':')[1]);

            // Calculer les heures et minutes de début et de fin en décimales
            const heureDebutDecimal = heureDebut + minuteDebut / 60;
            const heureFinDecimal = heureFin + minuteFin / 60;

            // Calculer la différence d'heures entre l'heure de début et l'heure de fin
            let differenceHeures = heureFinDecimal - heureDebutDecimal;

            if (enseignantHoraireMap[enseignantId]) {
                enseignantHoraireMap[enseignantId].totalHoraire += differenceHeures;
            } else {
                enseignantHoraireMap[enseignantId] = {
                    enseignant: {
                        _id: presence.enseignant._id,
                        nom: presence.enseignant.nom,
                        prenom: presence.enseignant.prenom,
                    },
                    totalHoraire: differenceHeures
                };
            }
        });

        // Étape 4: Combiner les enseignants sans présence avec ceux qui en ont
        const enseignantsPresences = [];

        uniqueEnseignantsIds.forEach(enseignantId => {
            const presence = enseignantHoraireMap[enseignantId];

            if (presence) {
                enseignantsPresences.push(presence);
            } else {
                const periodeCorrespondante = periodes.find(p =>
                    (p.enseignantPrincipal && p.enseignantPrincipal._id.equals(enseignantId)) ||
                    (p.enseignantSuppleant && p.enseignantSuppleant._id.equals(enseignantId))
                );

                if (periodeCorrespondante && periodeCorrespondante.enseignantPrincipal && periodeCorrespondante.enseignantPrincipal._id.equals(enseignantId)) {
                    enseignantsPresences.push({
                        enseignant: {
                            _id: periodeCorrespondante.enseignantPrincipal._id,
                            nom: periodeCorrespondante.enseignantPrincipal.nom,
                            prenom: periodeCorrespondante.enseignantPrincipal.prenom
                        },
                        totalHoraire: 0
                    });
                }

                if (periodeCorrespondante && periodeCorrespondante.enseignantSuppleant && periodeCorrespondante.enseignantSuppleant._id.equals(enseignantId)) {
                    enseignantsPresences.push({
                        enseignant: {
                            _id: periodeCorrespondante.enseignantSuppleant._id,
                            nom: periodeCorrespondante.enseignantSuppleant.nom,
                            prenom: periodeCorrespondante.enseignantSuppleant.prenom
                        },
                        totalHoraire: 0
                    });
                }
            }
        });

        const paginatedEnseignants = enseignantsPresences.slice(0, parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                presencePaies: paginatedEnseignants,
                totalPages: Math.ceil(enseignantsPresences.length / limit),
                currentPage: 1,
                totalItems: enseignantsPresences.length,
                pageSize: limit
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des présences :', error);
        res.status(500).json({ success: false, message: 'Erreur du serveur' });
    }
};


export const generateListPresenceByNiveau = async (req, res)=>{
    const { niveauId } = req.params;
    const { annee, semestre, langue, departement, section, cycle, niveau, fileType } = req.query;

    // Filtre pour l'année, le semestre et le niveau
    const periodeFilter = {};
    if (annee && !isNaN(annee)) {
        periodeFilter.annee = parseInt(annee);
    }
    if (semestre && !isNaN(semestre)) {
        periodeFilter.semestre = parseInt(semestre);
    }
    if (niveauId) {
        periodeFilter.niveau = niveauId;
    }

    // Étape 1: Obtenir tous les enseignants du niveau pour le semestre et l'année
    const periodes = await Periode.find(periodeFilter)
        .select('enseignantPrincipal enseignantSuppleant')
        .populate('enseignantPrincipal enseignantSuppleant', 'nom prenom');

    // Extraire les enseignants principaux et suppléants
    const enseignantsIds = periodes.reduce((acc, periode) => {
        if (periode.enseignantPrincipal) acc.push(periode.enseignantPrincipal._id);
        if (periode.enseignantSuppleant) acc.push(periode.enseignantSuppleant._id);
        return acc;
    }, []);

    // Supprimer les doublons
    const uniqueEnseignantsIds = [...new Set(enseignantsIds)];

    // Étape 2: Obtenir les présences des enseignants avec totalHoraire
    // Vérification des types et conversion en ObjectId si nécessaire
    const filter = { annee: parseInt(annee), semestre: parseInt(semestre) };

    if (mongoose.Types.ObjectId.isValid(niveauId)) {
        filter.niveau = niveauId; // Conversion du niveauId en ObjectId
    } else {
        return res.status(400).json({ success: false, message: "niveauId invalide" });
    }

    // Étape 2: Obtenir les présences des enseignants avec totalHoraire

     // Étape 1 : Récupérer toutes les présences
     const presences = await Presence.find(filter)
     .populate('enseignant', 'nom prenom')
     .exec();

        // Étape 2 : Calculer le totalHoraire pour chaque enseignant
        const enseignantHoraireMap = {};

        presences.forEach(presence => {
            const enseignantId = presence.enseignant._id;
            const heureDebut = parseInt(presence.heureDebut.split(':')[0]);
            const minuteDebut = parseInt(presence.heureDebut.split(':')[1]);
            const heureFin = parseInt(presence.heureFin.split(':')[0]);
            const minuteFin = parseInt(presence.heureFin.split(':')[1]);

            // Calculer les heures et minutes de début et de fin en décimales
            const heureDebutDecimal = heureDebut + minuteDebut / 60;
            const heureFinDecimal = heureFin + minuteFin / 60;

            // Calculer la différence d'heures entre l'heure de début et l'heure de fin
            let differenceHeures = heureFinDecimal - heureDebutDecimal;

            // Si la différence de minutes est négative, ajuster les heures
            if (minuteFin < minuteDebut) {
                differenceHeures -= 1 / 60; // Retirer une heure
            }
        
            if (enseignantHoraireMap[enseignantId]) {
                enseignantHoraireMap[enseignantId].totalHoraire += differenceHeures;
            } else {
                enseignantHoraireMap[enseignantId] = {
                    enseignant: {
                        _id: presence.enseignant._id,
                        nom: presence.enseignant.nom,
                        prenom: presence.enseignant.prenom,
                    },
                    totalHoraire: differenceHeures
                };
            }
        });

        // Étape 3: Combiner les enseignants sans présence avec ceux qui en ont
        const enseignantsPresences = [];

        uniqueEnseignantsIds.forEach(enseignantId => {
        // Chercher la présence de l'enseignant principal
        const presence = enseignantHoraireMap[enseignantId];
        
        if (presence) {
            // Si l'enseignant a une présence, on l'ajoute directement
            enseignantsPresences.push(presence);
        } else {
            // Si l'enseignant n'a pas de présence, on le récupère depuis les périodes
            const periodeCorrespondante = periodes.find(p => 
                (p.enseignantPrincipal && p.enseignantPrincipal._id.equals(enseignantId)) ||
                (p.enseignantSuppleant && p.enseignantSuppleant._id.equals(enseignantId))
            );

            // Récupération de l'enseignant principal
            if (periodeCorrespondante && periodeCorrespondante.enseignantPrincipal && periodeCorrespondante.enseignantPrincipal._id.equals(enseignantId)) {
                enseignantsPresences.push({
                    enseignant: {
                        _id: periodeCorrespondante.enseignantPrincipal._id,
                        nom: periodeCorrespondante.enseignantPrincipal.nom,
                        prenom: periodeCorrespondante.enseignantPrincipal.prenom
                    },
                    totalHoraire: 0 // Pas de présence enregistrée
                });
            }

            // Récupération de l'enseignant suppléant
            if (periodeCorrespondante && periodeCorrespondante.enseignantSuppleant && periodeCorrespondante.enseignantSuppleant._id.equals(enseignantId)) {
                enseignantsPresences.push({
                    enseignant: {
                        _id: periodeCorrespondante.enseignantSuppleant._id,
                        nom: periodeCorrespondante.enseignantSuppleant.nom,
                        prenom: periodeCorrespondante.enseignantSuppleant.prenom
                    },
                    totalHoraire: 0 // Pas de présence enregistrée
                });
            }
        }
    });

    let settings = await Setting.find().select('tauxHoraire');
    let setting = null;
    if(settings.length>0){
        setting=settings[0]
    }
    const tauxHoraire = setting?.tauxHoraire || 0;
    if(fileType.toLowerCase() === 'pdf'){
        let filePath='./templates/templates_fr/template_presence_fr.html';
        if(langue==='en'){
            filePath='./templates/templates_en/template_presence_en.html';
        }
        const htmlContent = await fillTemplate( langue, departement, section, cycle, niveau, enseignantsPresences, filePath, annee, semestre, tauxHoraire);

        // Générer le PDF à partir du contenu HTML
        generatePDFAndSendToBrowser(htmlContent, res, 'landscape');
    }else{
        exportToExcel(enseignantsPresences, langue, res, tauxHoraire);
    }
}

const exportToExcel = async (enseignantsPresences, langue, res, tauxHoraire ) => {
    if (enseignantsPresences) {
        // Créer un nouveau classeur Excel
        const workbook = new ExcelJS.Workbook();
        // Ajouter une nouvelle feuille de calcul
        const worksheet = workbook.addWorksheet('Sheet1');

        // Définir les en-têtes en fonction de la langue
        
        const headers = langue === 'fr' 
                ? ['Matricule', 'Nom', 'Prénom', 'Taux horaire', 'Nombre d\'heure', 'Gratification brute', 'IRNC', 'Gratification nette']
                : ['Regist.', 'Last Name', 'First Name', 'Hourly rate', 'Number of hours', 'Gross bonus', 'IRNC', 'Net bonus'];
        

        // Ajouter les en-têtes à la feuille de calcul
        worksheet.addRow(headers);
        
        // Ajouter les données des étudiants
        enseignantsPresences.forEach(enseignantsPresence => {
            const montantBrut = calculGrossBonus(enseignantsPresence?.totalHoraire || 0, tauxHoraire);
            const irnc = calculIRNC(montantBrut);
            const montantNet = calculNetBonus(montantBrut, irnc);
            worksheet.addRow([
                enseignantsPresence.enseignant?.matricule || "", enseignantsPresence.enseignant?.nom || "", enseignantsPresence.enseignant?.prenom || "", tauxHoraire,
                enseignantsPresence.totalHoraire, montantBrut, irnc, montantNet

            ]);
            
        });

        // Définir les en-têtes de réponse pour le téléchargement du fichier
        res.setHeader('Content-Disposition', `attachment; filename=presence_${langue}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Envoyer le fichier Excel en réponse
        await workbook.xlsx.write(res);
        res.end(); // Terminer la réponse après l'écriture du fichier
    } else {
        // Gérer le cas où `etudiants` est indéfini
        res.status(400).json({ success: false, message: message.pas_de_donnees });
    }
};

async function fillTemplate (departement, section, cycle, niveau, langue, enseignantsPresences, filePath, annee, semestre, tauxHoraire) {
    try {
        const htmlString = await loadHTML(filePath);
        const $ = cheerio.load(htmlString); // Charger le template HTML avec cheerio
        const body = $('body');
        body.find('#division-fr').text(departement.libelleFr);
        body.find('#division-en').text(departement.libelleEn);
        body.find('#section-fr').text(section.libelleFr);
        body.find('#section-en').text(section.libelleEn);
        body.find('#cycle-niveau').text(cycle.code+""+niveau.code);
        body.find('#annee').text(formatYear(parseInt(annee)));
        body.find('#semestre').text(semestre);
        const userTable = $('#table-enseignant');
        const rowTemplate = $('.row_template');
        let i = 1;
        for (const enseignantsPresence of enseignantsPresences) {
            const clonedRow = rowTemplate.clone();
            const montantBrut = calculGrossBonus(enseignantsPresence?.totalHoraire || 0, tauxHoraire);
            const irnc = calculIRNC(montantBrut);
            const montantNet = calculNetBonus(montantBrut, irnc);
            clonedRow.find('#num').text(i);
            clonedRow.find('#matricule').text(enseignantsPresence.enseignant?.matricule || "");
            clonedRow.find('#nom').text(enseignantsPresence.enseignant?.nom || "");
            clonedRow.find('#prenom').text(enseignantsPresence.enseignant?.prenom || "");
            clonedRow.find('#taux_horaire').text(tauxHoraire);
            clonedRow.find('#nb_heure').text(enseignantsPresence?.totalHoraire || 0);
            clonedRow.find('#montant_brut').text(montantBrut);
            clonedRow.find('#irnc').text(irnc);
            clonedRow.find('#montant_net').text(montantNet);
            userTable.append(clonedRow);
            i++;
        }
        rowTemplate.first().remove();

        return $.html(); // Récupérer le HTML mis à jour
    } catch (error) {
        console.error('Erreur lors du remplissage du template :', error);
        return '';
    }
};




