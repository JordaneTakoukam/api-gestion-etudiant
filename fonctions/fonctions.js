import * as crypto from 'crypto';
import { message } from '../configs/message.js';
import { create } from 'html-pdf';
import { readFile } from 'fs';



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

export function formatYear(year) {
    return `${year}-${year + 1}`;
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

export function generatePDFAndSendToBrowser(htmlContent, res) {
    const options = {
        format: 'A4', // Format de page
        border: {
            top: '10mm',    // Marge supérieure
            right: '10mm',  // Marge droite
            bottom: '10mm', // Marge inférieure
            left: '10mm'    // Marge gauche
        }
    };
    console.log(htmlContent);
    create(htmlContent, options).toStream((err, stream) => {
        if (err) {
            console.error('Erreur lors de la génération du PDF :', err);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la génération du PDF'
            });
        } else {
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=evenements.pdf' // Nom du fichier PDF
            });
            stream.pipe(res);
        }
    });
}


