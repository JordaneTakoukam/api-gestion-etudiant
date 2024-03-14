import express from "express";
import { deleteAllSettings, getSettings } from "../../controllers/setting/_default_setting.controller.js";


const router = express.Router();

router.get("", getSettings);


router.delete("/delete", deleteAllSettings);




export default router;
