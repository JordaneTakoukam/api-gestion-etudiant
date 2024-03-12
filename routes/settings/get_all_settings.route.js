import express from "express";
import { getSettings } from "../../controllers/setting/_default_setting.controller.js";


const router = express.Router();

router.get("", getSettings);




export default router;
