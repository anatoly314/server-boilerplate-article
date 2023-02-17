import express from 'express';
import apiRouter from "./api/api-route.js";

const app = express();
app.use(express.json());
app.use('/api', apiRouter);
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});
