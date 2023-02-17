import express from "express";
import {dirname} from "path";
import {fileURLToPath} from "url";
import {getResolver, registerResolvers} from "./resolvers-provider.js";
const router = express.Router();

router.post('*', async (req, res, next) => {
    const body = req.body;
    const resolverName = req.url.substring(1);
    const resolver = getResolver(resolverName);
    const result = await resolver({body});
    return res.json(result);
});

const __dirname = dirname(fileURLToPath(import.meta.url));
await registerResolvers(__dirname);

export default router;
