import { generateConfirmationCode } from '../../fonctions/fonctions.js';
import User from '../../models/user.model.js';
import { sendPasswordResetEmail } from '../../utils/reset_password.js';
import { sendEmailConfirmation } from '../../utils/send_email_confirmation.js';
import { DateTime } from 'luxon';
import bcrypt from "bcrypt";
import mongoose from 'mongoose';
import { message } from '../../configs/message.js';

export const sendVerificationCodeByEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: {
          fr: 'Email est requis',
          en: 'Email is required',
        },
      });
    }

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
      sendPasswordResetEmail(`${user.nom} ${user.prenom}`, email, verificationCode);
    } catch (error) {
      console.error("Erreur lors de l'envoi du code de vérification par e-mail:", error);
      return res.status(500).json({
        success: false,
        message: {
          fr: "Une erreur est survenue lors de l'envoi du code de vérification par e-mail.",
          en: "An error occurred while sending the verification code via email."
        },
      });
    }

    return res.status(200).json({
      data: user._id,
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

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: {
          fr: 'Identifiant utilisateur est requis',
          en: 'User ID is required',
        },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: {
          fr: 'Identifiant utilisateur invalide',
          en: 'Invalid user ID',
        },
      });
    }

    if (!code || code.length < 6) {
      return res.status(402).json({
        success: false,
        message: {
          fr: 'Le code de vérification doit comporter au moins 6 caractères',
          en: 'Verification code must be at least 6 characters long',
        },
      });
    }





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
    if (DateTime.now() > DateTime.fromJSDate(user.verificationCode.expirationDate) || user.verificationCode.code !== code) {
      if (user.verificationCode.code !== code) {
        return res.status(406).json({
          success: false,
          message: {
            fr: "Code invalide",
            en: "Invalid code"
          }
        });
      }
      return res.status(405).json({
        success: false,
        message: {
          fr: "Code expiré",
          en: "Expired code"
        }
      });
    } else {
      return res.json({
        success: true,
        message: {
          fr: "Code valide",
          en: "Valid code"
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






// verifier le mot de passe

// verifier le mot de passe

export const verifierMotDePasse = async (req, res) => {
  try {
    const { userId, motDePasse } = req.body;

    // Vérification de la validité de l'ID utilisateur
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: {
          fr: "Identifiant invalide",
          en: "Invalid ID"
        }
      });
    }

    // Recherche de l'utilisateur par ID
    const user = await User.findById(userId);

    // Vérification de l'existence de l'utilisateur
    if (!user) {
      return res.status(404).json({
        success: false,
        message: {
          fr: "Utilisateur non trouvé",
          en: "User not found"
        }
      });
    }

    // Vérification du mot de passe
    const isPasswordCorrect = await bcrypt.compare(motDePasse, user.mot_de_passe);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: {
          fr: "Mot de passe incorrect",
          en: "Incorrect password"
        }
      });
    }

    // Réponse de succès si le mot de passe est correct
    return res.json({
      success: true,
      message: {
        fr: "Mot de passe correct",
        en: "Password correct"
      }
    });
  } catch (error) {
    console.error("Erreur inattendue lors de la vérification du mot de passe:", error);
    return res.status(500).json({
      success: false,
      message: {
        fr: "Erreur inattendue lors de la vérification du mot de passe",
        en: "Unexpected error verifying password"
      }
    });
  }
};



