// const express = require('express');
import { extractRawText } from 'mammoth';
// const { MongoClient } = require('mongodb');

// const app = express();
// const port = 3000;

// MongoDB connection URI
// const uri = "mongodb://localhost:27017";
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function lireDonneesFichierWord(fichier, fichierEn) {
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
                    titre_matiere: currentMatiere,
                    libelleFr: lines[index - 1],
                    libelleEn: lines[index - 1],
                    typesEnseignement: [{
                        typeEnseignement: "",
                        volumeHoraire: 0
                    },
                    {
                        typeEnseignement: "",
                        volumeHoraire: 0
                    },
                    {
                        typeEnseignement:"", 
                        volumeHoraire: 0
                    }],
                    // CM: 0,
                    // TD: 0,
                    // TP: 0
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
                currentMatiere = lines[index - 1];
            }

            previousLineWasText = true;
        }

        
    });
    
    console.log(donnees);
    return donnees;
}

const filePath = 'maquette_fr.docx';
const filePathEn = 'maquette_en.docx';
lireDonneesFichierWord(filePath,filePathEn);
