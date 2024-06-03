import { extractRawText } from 'mammoth';

const matieres = [
    {
        libelleFr: 'Introduction à la fiscalité',
        libelleEn: 'Introduction to Taxation',
        prerequisFr: '',
        prerequisEn: '',
        approchePedFr: '',
        approchePedEn: '',
        evaluationAcquisFr: 'Contrôle continu, Examen écrit',
        evaluationAcquisEn: 'Continuous assessment, Written exam',
        typesEnseignement: [],
        chapitres: [],
        objectifs: []
    },
    {
        libelleFr: 'Politique fiscale',
        libelleEn: 'Tax Policy',
        prerequisFr: '',
        prerequisEn: '',
        approchePedFr: '',
        approchePedEn: '',
        evaluationAcquisFr: 'Contrôle continu, Examen écrit',
        evaluationAcquisEn: 'Continuous assessment, Written exam',
        typesEnseignement: [],
        chapitres: [],
        objectifs: []
    }
];

async function lireDonneesFichierWord(fichier, fichierEn) {
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
                    semestre:1,
                    code:"",
                    libelleFr: competenceFr,
                    libelleEn: competencesEn[ind],
                    matiere: currentMatiere ? currentMatiere.libelleFr : '',
                    etat:0,
                    date_etat:undefined
                };
                donnees.push(currentObjectif);
            });
        }
    });
    
    console.log(donnees);
    return donnees;
}

// Utiliser la fonction pour tester
const filePath = 'maquette_fr.docx'; // Remplacez ceci par le chemin de votre fichier en français
const filePathEn = 'maquette_en.docx'; // Remplacez ceci par le chemin de votre fichier en anglais
lireDonneesFichierWord(filePath, filePathEn);
