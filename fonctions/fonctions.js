import * as crypto from 'crypto';


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
