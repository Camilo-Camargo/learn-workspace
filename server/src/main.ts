import express from "express";

const app = express();
const port = 8080;

app.get('/', (req, res) => {
    res.send('Server version 0.0.1');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

