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
    
    // Structure pour stocker les données
    const donnees = [];
    let currentMatiere = null;
    let captureNextLines = false;
    let captureNextLinesAcquis = false; 

    // Split text into lines
    const lines = text.split('\n');
    const linesEn = textEn.split('\n');
    
    lines.forEach((line, index) => {
        line = line.trim();
        
        if (line.length === 0) return;

        // Détecter la section "Compétences acquises"
        if (line.startsWith('Compétences acquises')) {
            captureNextLines = true;
            return; // Skip the "Compétences acquises" line
        }

        if (line.startsWith('Prérequis') && currentMatiere) {
            captureNextLinesAcquis = true;
            return; // Skip the "Compétences acquises" line
        }



        // Si on doit capturer les lignes après "Compétences acquises"
        if (captureNextLines) {
            // Les titres des matières
           
            currentMatiere = {
                libelleFr: line,
                libelleEn: linesEn[index],
                prerequisFr:"",
                prerequisEn:"",
                approchePedFr:"",
                approchePedEn:"",
                evaluationAcquisFr: "",
                evaluationAcquisEn:"",
                typesEnseignement:[],
                chapitres:[],
                objectifs:[],
            };
            captureNextLines=false;
        }

        if(captureNextLinesAcquis){
            currentMatiere.evaluationAcquisFr = line.replace("Evaluation des acquis :", "").trim();
            currentMatiere.evaluationAcquisEn = linesEn[index].replace("Knowledge assessment :", "").trim();
            captureNextLinesAcquis=false;
            donnees.push(currentMatiere);
        }
    });
    
    console.log(donnees);
    return donnees;
}

const filePath = 'maquette_fr.docx';
const filePathEn = 'maquette_en.docx';
lireDonneesFichierWord(filePath,filePathEn);
