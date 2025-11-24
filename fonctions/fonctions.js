import * as crypto from 'crypto';
import { message } from '../configs/message.js';
import { create } from 'html-pdf';
import { readFile } from 'fs';
import puppeteer from 'puppeteer';
import fs from "fs";
import path from "path";



// generer le mot de passes
export function generateRandomPassword() {
    const characters = 'ABCDEFGHIGKLMNPQRSTUVWXYZabcdefghigklmnpqrstuvwxyz@!#*';
    const length = 8;
    let randomId = '';
    let numCount = 0; // Compteur pour les chiffres

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        const char = characters[randomIndex];

        if (!isNaN(char)) { // Vérifie si le caractère est un chiffre
            numCount++; // Incrémente le compteur de chiffres
        }

        randomId += char;
    }

    // Vérifie si le nombre de chiffres est inférieur à 2
    while (numCount < 2) {
        // Génère un nouvel ID en remplaçant un caractère aléatoire par un chiffre
        const randomIndex = Math.floor(Math.random() * (length - 1)); // -1 pour ne pas toucher au dernier caractère
        const randomNum = Math.floor(Math.random() * 9) + 1; // Génère un chiffre aléatoire de 1 à 9 (exclut 0)
        randomId = randomId.substring(0, randomIndex) + randomNum + randomId.substring(randomIndex + 1);

        numCount++; // Incrémente le compteur de chiffres
    }

    return randomId;
}

export function encrypt(value, secretKey) {
    // Generate a random initialization vector (IV) for CBC mode
    const iv = crypto.randomBytes(16);

    // Create the cipher with the algorithm, key, and IV
    const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);

    // Encrypt in multiple steps for large data
    let encryptedChunk = cipher.update(value, 'utf8', 'hex');
    encryptedChunk += cipher.final('hex');

    // Prepend the IV to the ciphertext for decryption
    const ciphertextWithIV = iv.toString('hex') + encryptedChunk;

    return ciphertextWithIV;
}

export function premierElement(value) {
    // Diviser la chaîne en fonction des espaces
    if (value) {
      const elements = value.split(" ");
      // Récupérer le premier élément
      const premier = elements[0];
      return premier;
    }
    return undefined;
  }

export function verifierEntier(value, res) {
    const isInteger = Number.isInteger(value);
    if (!isInteger) {
        return res.status(400).json({
            success: false,
            message: message.nombre_entier
        });

    }
}

export function generateConfirmationCode() {
    let code = '';
    const length = 6;
    const digits = '0123456789';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        code += digits[randomIndex];
    }

    return code;
}

export function formatDate(date){
    const dateStr = date;
    const dateObj = new Date(dateStr);
  
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // +1 car les mois sont indexés à partir de 0
    const day = dateObj.getDate().toString().padStart(2, '0');
  
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}

export function formatDateFr(date){
    const dateStr = date;
    const dateObj = new Date(dateStr);
  
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // +1 car les mois sont indexés à partir de 0
    const day = dateObj.getDate().toString().padStart(2, '0');
  
    const formattedDate = `${day}-${month}-${year}`;
    return formattedDate;
}

export function formatYear(year) {
    return `${year}-${year + 1}`;
}

export function calculGrossBonus(totalHoraire, tauxHoraire) {
    return (totalHoraire * tauxHoraire);
}

export function calculIRNC(montantBrut) {
    return ((montantBrut * 11)/100);
}

export function calculNetBonus(montantBrut, irnc) {
    return (montantBrut - irnc);
}

export function loadHTML(filePath) {
    return new Promise((resolve, reject) => {
        readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

// Dans votre fichier fonctions.js
export const generatePDFAndSendToBrowser = async (htmlContent, res, orientation = "portrait") => {
    let browser = null;

    try {
        console.log("=== Début génération PDF ===");
        console.log("Longueur HTML:", htmlContent?.length);
        console.log("Orientation:", orientation);
        console.log("NODE_ENV =", process.env.NODE_ENV);

        if (!htmlContent || htmlContent.trim() === "") {
            throw new Error("Le contenu HTML est vide");
        }

        if (!res || res.headersSent) {
            throw new Error("La réponse est invalide ou déjà envoyée");
        }

        // ================================
        // 🔥 Détection du chemin Chrome
        // ================================
        let executablePath = null;

        if (process.env.NODE_ENV === "production") {
            const chromeDir = process.env.PUPPETEER_CACHE_DIR;

            // Nouveau chemin valide pour Chromium sur Render
            executablePath = path.join(
                chromeDir,
                "chromium",
                "linux-ubuntu-22.04",
                "chrome-linux",
                "chrome"
            );

            console.log("Chemin Chromium attendu :", executablePath);

            // Vérification réelle
            if (!fs.existsSync(executablePath)) {
                console.error("❌ Chromium introuvable à :", executablePath);
                throw new Error("Chromium n’est pas installé dans PUPPETEER_CACHE_DIR");
            }

            console.log("✅ Chromium trouvé !");
        }


        // ================================
        // 🔥 Lancement du navigateur
        // ================================
        browser = await puppeteer.launch({
            headless: true,
            executablePath, // auto null si dev
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-zygote",
                "--single-process",
                "--disable-extensions"
            ]
        });

        console.log("Navigateur lancé");

        const page = await browser.newPage();

        await page.setViewport({
            width: 1200,
            height: 800,
            deviceScaleFactor: 1
        });

        await page.setContent(htmlContent, {
            waitUntil: ["load", "networkidle0"],
            timeout: 30000
        });

        await page.evaluateHandle("document.fonts.ready");

        console.log("HTML + Polices chargés");

        const pdf = await page.pdf({
            format: "A4",
            landscape: orientation === "landscape",
            printBackground: true,
            margin: {
                top: "20px",
                right: "20px",
                bottom: "20px",
                left: "20px"
            }
        });

        console.log("PDF généré :", pdf.length, "bytes");

        await browser.close();
        browser = null;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdf.length.toString());
        res.setHeader("Content-Disposition", "attachment; filename=liste_etudiants.pdf");

        res.end(pdf, "binary");

        console.log("=== PDF envoyé avec succès ===");

    } catch (error) {
        console.error("=== ERREUR PDF ===", error.message);

        if (browser) {
            try {
                await browser.close();
            } catch {}
        }

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Erreur lors de la génération du PDF",
                error: error.message
            });
        }
    }
};


export function nbTotalAbsences(listeAbsences) {
    // Vérifier si la liste d'absences est vide
    if(listeAbsences){
      
      if (listeAbsences.length === 0) {
        return '0';
      }
  
      // Initialiser la somme totale d'heures à 0
      let totalHours = 0;
  
      // Parcourir chaque absence dans la liste
      listeAbsences.forEach(absence => {
        // Extraire les heures de début et de fin de l'absence
        const heureDebut = parseInt(absence.heureDebut.split(':')[0]);
        const minuteDebut = parseInt(absence.heureDebut.split(':')[1]);
        const heureFin = parseInt(absence.heureFin.split(':')[0]);
        const minuteFin = parseInt(absence.heureFin.split(':')[1]);
  
        // Calculer les heures et minutes de début et de fin en décimales
        const heureDebutDecimal = heureDebut + minuteDebut / 60;
        const heureFinDecimal = heureFin + minuteFin / 60;
  
        // Calculer la différence d'heures entre l'heure de début et l'heure de fin
        let differenceHeures = heureFinDecimal - heureDebutDecimal;
  
        // Calculer la différence de minutes entre l'heure de début et l'heure de fin
        // const differenceMinutes = minuteFin - minuteDebut;
  
        // Si la différence de minutes est positive, ajouter une heure supplémentaire
        // if (differenceMinutes > 0) {
        //   totalHours += 1;
        // }
        // Si la différence de minutes est négative, ajuster les heures
        if (minuteFin < minuteDebut) {
            differenceHeures -= 1 / 60; // Retirer une heure
        }
        // Ajouter la différence d'heures à la somme totale d'heures
        totalHours += differenceHeures;
      });
  
      // Retourner la somme totale d'heures sous forme de chaîne
      let formatHour;
      if (Number.isInteger(totalHours)) {
          formatHour = totalHours.toString();
      } else {
          formatHour = totalHours.toFixed(2);
      }
      return formatHour.toString();
    }
    return '0';
}

export function nbTotalAbsencesJustifier(listeAbsences) {
    // Vérifier si la liste d'absences est vide
    if(listeAbsences){
      
      if (listeAbsences.length === 0) {
        return '0';
      }
  
      // Initialiser la somme totale d'heures à 0
      let totalHours = 0;
  
      // Parcourir chaque absence dans la liste
      listeAbsences.forEach(absence => {
        // Extraire les heures de début et de fin de l'absence
        if(absence.etat==1){
            const heureDebut = parseInt(absence.heureDebut.split(':')[0]);
            const minuteDebut = parseInt(absence.heureDebut.split(':')[1]);
            const heureFin = parseInt(absence.heureFin.split(':')[0]);
            const minuteFin = parseInt(absence.heureFin.split(':')[1]);
    
            // Calculer les heures et minutes de début et de fin en décimales
            const heureDebutDecimal = heureDebut + minuteDebut / 60;
            const heureFinDecimal = heureFin + minuteFin / 60;
    
            // Calculer la différence d'heures entre l'heure de début et l'heure de fin
            let differenceHeures = heureFinDecimal - heureDebutDecimal;
    
            // Calculer la différence de minutes entre l'heure de début et l'heure de fin
            // const differenceMinutes = minuteFin - minuteDebut;
    
            // Si la différence de minutes est positive, ajouter une heure supplémentaire
            // if (differenceMinutes > 0) {
            //   totalHours += 1;
            // }
            // Si la différence de minutes est négative, ajuster les heures
            if (minuteFin < minuteDebut) {
                differenceHeures -= 1 / 60; // Retirer une heure
            }
            // Ajouter la différence d'heures à la somme totale d'heures
            totalHours += differenceHeures;
        }
      });
  
      // Retourner la somme totale d'heures sous forme de chaîne
      let formatHour;
      if (Number.isInteger(totalHours)) {
          formatHour = totalHours.toString();
      } else {
          formatHour = totalHours.toFixed(2);
      }
      return formatHour.toString();
    }
    return '0';
}

export function nbTotalAbsencesNonJustifier(listeAbsences) {
    // Vérifier si la liste d'absences est vide
    if(listeAbsences){
      
      if (listeAbsences.length === 0) {
        return '0';
      }
  
      // Initialiser la somme totale d'heures à 0
      let totalHours = 0;
  
      // Parcourir chaque absence dans la liste
      listeAbsences.forEach(absence => {
        // Extraire les heures de début et de fin de l'absence
        if(absence.etat==0){
            const heureDebut = parseInt(absence.heureDebut.split(':')[0]);
            const minuteDebut = parseInt(absence.heureDebut.split(':')[1]);
            const heureFin = parseInt(absence.heureFin.split(':')[0]);
            const minuteFin = parseInt(absence.heureFin.split(':')[1]);
    
            // Calculer les heures et minutes de début et de fin en décimales
            const heureDebutDecimal = heureDebut + minuteDebut / 60;
            const heureFinDecimal = heureFin + minuteFin / 60;
    
            // Calculer la différence d'heures entre l'heure de début et l'heure de fin
            let differenceHeures = heureFinDecimal - heureDebutDecimal;
    
            // Calculer la différence de minutes entre l'heure de début et l'heure de fin
            // const differenceMinutes = minuteFin - minuteDebut;
    
            // Si la différence de minutes est positive, ajouter une heure supplémentaire
            // if (differenceMinutes > 0) {
            //   totalHours += 1;
            // }
            // Si la différence de minutes est négative, ajuster les heures
            if (minuteFin < minuteDebut) {
                differenceHeures -= 1 / 60; // Retirer une heure
            }
            // Ajouter la différence d'heures à la somme totale d'heures
            totalHours += differenceHeures;
        }
      });
  
      // Retourner la somme totale d'heures sous forme de chaîne
      let formatHour;
      if (Number.isInteger(totalHours)) {
          formatHour = totalHours.toString();
      } else {
          formatHour = totalHours.toFixed(2);
      }
      return formatHour.toString();
    }
    return '0';
}

export function calculateProgress (matiere, annee, semestre) {
    let totalObjectifs = 0;
    let objectifsAvecEtat1 = 0;
    if(matiere && matiere.objectifs){
        
        matiere.objectifs.forEach((objectif) => {
            if(objectif.annee==annee && objectif.semestre==semestre){
                totalObjectifs += 1;
                if (objectif.etat == 1) {
                    objectifsAvecEtat1++;
                }
            }
            
        });
    }
    

    const progress = totalObjectifs === 0 ? 0 : (objectifsAvecEtat1 / totalObjectifs) * 100;
    // console.log(objectifsAvecEtat1+"/"+totalObjectifs)

    return parseFloat(progress.toFixed(2));
}

export function calculateProgressChapitre (matiere, annee, semestre) {
    let totalChapitres = 0;
    let chapitresAvecEtat1 = 0;
    if(matiere && matiere.chapitres){
        
        matiere.chapitres.forEach((chapitre) => {
            if(chapitre.annee==annee && chapitre.semestre==semestre){
                totalChapitres += 1;
                if (chapitre.etat == 1) {
                    chapitresAvecEtat1++;
                }
            }
            
        });
    }
    

    const progress = totalChapitres === 0 ? 0 : (chapitresAvecEtat1 / totalChapitres) * 100;
    // console.log(chapitresAvecEtat1+"/"+totalChapitres)

    return parseFloat(progress.toFixed(2));
}

export function formatNameSurname (value) {
    const values = value.split(" ");
    if(values.length>1){
        return values[0];
    }
    return value;
}



