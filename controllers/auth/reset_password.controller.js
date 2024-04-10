import { generateConfirmationCode } from '../../fonctions/fonctions.js';
import User from '../../models/user.model.js';
import { sendPasswordResetEmail } from '../../utils/reset_password.js';
import { sendEmailConfirmation } from '../../utils/send_email_confirmation.js';
import { DateTime } from 'luxon';
import bcrypt from "bcrypt";

export const sendVerificationCodeByEmail = async (req, res) => {
  try {
    const { email } = req.body;
    let verificationCode;
    const expirationDate = DateTime.now().plus({ hours: 24 }); // Ajoute 24 heures à la date actuelle

    try {
      verificationCode = generateConfirmationCode();
    } catch (error) {
      console.error("Erreur lors de la génération du code de vérification:", error);
      return res.status(500).json({
        success: false,
        message: {
          fr: "Une erreur est survenue lors de la génération du code de vérification.",
          en: "An error occurred while generating the verification code."
        }
      });
    }

    var user;
    try {
      user = await User.findOneAndUpdate({ email: email }, { verificationCode: { code: verificationCode, expirationDate: expirationDate.toJSDate() } });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du code de vérification dans la base de données:", error);
      return res.status(500).json({
        success: false,
        message: {
          fr: "Une erreur est survenue lors de la mise à jour du code de vérification dans la base de données.",
          en: "An error occurred while updating the verification code in the database."
        }
      });
    }

    try {
      await sendPasswordResetEmail(user.nom, email, verificationCode);
    } catch (error) {
      console.error("Erreur lors de l'envoi du code de vérification par e-mail:", error);
      return res.status(500).json({
        success: false,
        message: {
          fr: "Une erreur est survenue lors de l'envoi du code de vérification par e-mail.",
          en: "An error occurred while sending the verification code via email."
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: {
        fr: "Le code de vérification a été envoyé avec succès.",
        en: "Verification code has been sent successfully."
      }
    });
  } catch (error) {
    console.error("Erreur inattendue lors de l'envoi du code de vérification par e-mail:", error);
    return res.status(500).json({
      success: false,
      message: {
        fr: "Une erreur inattendue est survenue lors de l'envoi du code de vérification par e-mail.",
        en: "An unexpected error occurred while sending the verification code via email."
      }
    });
  }
};











// Fonction pour vérifier si le code de vérification est valide
export const verifyVerificationCode = async (req, res) => {
  try {
    const { userId, code } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: {
          fr: "Utilisateur non trouvé",
          en: "User not found"
        }
      });
    }

    // Vérifier si la date d'expiration est dépassée
    if (user.verificationCode.code !== code || DateTime.now() > DateTime.fromJSDate(user.verificationCode.expirationDate)) {
      return res.status(400).json({
        success: false,
        message: {
          fr: "Code de vérification invalide, expiré ou non vérifier",
          en: "Invalid or expired verification code"
        }
      });
    } else {
      return res.json({
        success: true,
        message: {
          fr: "Code de vérification valide",
          en: "Valid verification code"
        }
      });
    }
  } catch (error) {
    console.error("Une erreur est survenue:", error);
    return res.status(500).json({
      success: false,
      message: {
        fr: "Erreur interne du serveur",
        en: "Internal server error"
      }
    });
  }
};
















// update -----------

export const updatePassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: {
          fr: "Utilisateur non trouvé",
          en: "User not found"
        }
      });
    }

    const saltRounds = 10; // Nombre de tours pour le hachage
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    try {
      await User.findByIdAndUpdate(userId, { mot_de_passe: hashedPassword, verificationCode: { code: null, expirationDate: null, verificationCode: false } });

    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      return res.status(500).json({
        success: false,
        message: {
          fr: "Erreur lors de la mise à jour du mot de passe",
          en: "Error updating password"
        }
      });
    }

    try {
      await sendEmailConfirmation(user.email, "Votre mot de passe a été mis à jour avec succès.");
    } catch (error) {
      console.error("Erreur lors de l'envoi de la confirmation par e-mail:", error);
      return res.status(500).json({
        success: false,
        message: {
          fr: "Erreur lors de l'envoi de la confirmation par e-mail",
          en: "Error sending email confirmation"
        }
      });
    }

    return res.json({
      success: true,
      message: {
        fr: "Mot de passe mis à jour avec succès",
        en: "Password updated successfully"
      }
    });
  } catch (error) {
    console.error("Erreur inattendue lors de la mise à jour du mot de passe:", error);
    return res.status(500).json({
      success: false,
      message: {
        fr: "Erreur inattendue lors de la mise à jour du mot de passe",
        en: "Unexpected error updating password"
      }
    });
  }
};
