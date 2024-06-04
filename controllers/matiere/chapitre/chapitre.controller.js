import Chapitre from '../../../models/chapitre.model.js';
import Matiere from '../../../models/matiere.model.js'
import { message } from '../../../configs/message.js';
import mongoose from 'mongoose';
import { extractRawText } from 'mammoth';

// create
export const createChapitre = async (req, res) => {
    const {annee, semestre, code, libelleFr, libelleEn, typesEnseignement, matiere, objectifs } = req.body;

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
            matiere,
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
    const { annee, semestre, code, libelleFr, libelleEn, typesEnseignement, matiere, objectifs } = req.body;

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
    const {page=1, pageSize=10, annee, semestre}=req.query;
    try {
         // Récupération des chapitres avec pagination
         const startIndex = (page - 1) * pageSize;

        // Récupérer la liste des chapitres d'une matière
        const chapitres = await Chapitre.find({matiere:matiereId, annee:annee, semestre:semestre})
        .skip(startIndex)
        .limit(parseInt(pageSize));
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



// read
export const readChapitre = async (req, res) => { }


export const readChapitres = async (req, res) => { }


