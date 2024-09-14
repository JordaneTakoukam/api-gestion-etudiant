import QRCode from 'qrcode';
import crypto from 'crypto';
import { message } from '../../configs/message.js';


// Fonction pour générer la signature de validation
const generateSignature = (data, secret) => {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

export const generateQrCode = async (req, res) => { 
    const { section, cycle, niveau, annee, semestre } = req.body;

    if (!section || !cycle || !niveau || !annee || !semestre) {
        return res.status(400).json({ success:false, message: message.champ_obligatoire });
    }

    try {
        const sectionToSave={_id:section._id, libelleFr:section.libelleFr, libelleEn:section.libelleEn};
        const cycleToSave={_id:cycle._id, libelleFr:cycle.libelleFr, libelleEn:cycle.libelleEn};
        const niveauToSave={_id:niveau._id, libelleFr:niveau.libelleFr, libelleEn:niveau.libelleEn};
        // Créer une chaîne de données pour le QR code
        const presenceData = {
            annee,
            semestre,
            section:sectionToSave,
            cycle:cycleToSave,
            niveau:niveauToSave
        };

        // Générer une signature de validation pour éviter la falsification
        const secretKey = process.env.SECRET_SESSION_KEYS ; // Clé secrète que tu dois sécuriser
        const signature = generateSignature(JSON.stringify(presenceData), secretKey);

        // Ajouter la signature aux données
        const dataWithSignature = { ...presenceData, signature };

        // Convertir les données en string pour le QR code
        const qrString = JSON.stringify(dataWithSignature);

        // Générer le QR code
        const qrCodeDataUrl = await QRCode.toDataURL(qrString);

        // Retourner le QR code sous forme d'image (base64)
        res.json({ success:true, qrCode: qrCodeDataUrl });
    } catch (error) {
        res.status(500).json({ success:false, message:message.erreurServeur});
    }

}