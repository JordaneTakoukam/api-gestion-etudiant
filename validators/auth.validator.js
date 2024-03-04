import yup from "yup";
import { keyRoleApp } from "../configs/key_role.js";

export async function validateCreateSuperAdmin(req, res, next) {
    try {
        const schema = yup.object().shape({
            email: yup.string().email().required(),
        });

        const validatedData = await schema.validate(req.body);
        req.validatedData = validatedData;
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

export async function validateCreateAccountUser(req, res, next) {
    const validRoles = [keyRoleApp.superAdmin, keyRoleApp.admin, keyRoleApp.moderator];

    try {
        const schema = yup.object().shape({
            role: yup.string().required().oneOf(validRoles),
            email: yup.string().email().required(),
        });

        const validatedData = await schema.validate(req.body);
        req.validatedData = validatedData;
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}


export async function validateSignIn(req, res, next) {
    try {
        const schema = yup.object().shape({
            loginId: yup.string().required(),
            password: yup.string().required(),
        });

        const validatedData = await schema.validate(req.body);
        req.validatedData = validatedData;
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}








export async function validateChangePassword(req, res, next) {
    try {
        const schema = yup.object().shape({
            loginId: yup.string().required(),
            oldPassword: yup.string().required(),
            newPassword: yup.string().required(),
        });

        const validatedData = await schema.validate(req.body);
        req.validatedData = validatedData;
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}




export async function validateChangePasswordUser(req, res, next) {
    try {
        const schema = yup.object().shape({
            oldPassword: yup.string().required(),
            newPassword: yup.string().required(),
        });

        const validatedData = await schema.validate(req.body);
        req.validatedData = validatedData;
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}
