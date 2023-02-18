import express from "express";
import {dirname} from "path";
import {fileURLToPath} from "url";
import {getResolver, registerResolvers} from "./resolvers-provider.js";
const router = express.Router();

router.post('*', async (req, res, next) => {
    try {
        const body = req.body;
        const authorizedUser = req.header('Authorization');
        const resolverName = req.url.substring(1);
        const resolver = getResolver(resolverName);
        const result = await resolver({body, authorizedUser});
        return res.json(result);
    } catch (err) {
        if (err.message === 'Unauthenticated') {
            res.status(401);
            res.send(err.message);
        } else {
            res.status(500);
            res.send("Server error");
        }
    }
});

const __dirname = dirname(fileURLToPath(import.meta.url));
await registerResolvers(__dirname);

export default router;
