import express from "express";
const router = express.Router();

router.get('*', async (req, res, next) => {
    const response = {
        text: 'Hello World!'
    };
    return res.json(response);
})

export default router;
