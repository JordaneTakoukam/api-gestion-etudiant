import express from "express";

const router = express.Router();

router.get("/", (_, res) => {
    res.status(200).json({
        message: "Welcome to the API",
        status: true,
    });
});


export default router;