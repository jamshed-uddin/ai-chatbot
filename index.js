import express from "express";
import "dotenv/config.js";
import path from "path";
const app = express();
const port = process.env.PORT;

const dirname = path.resolve();
const files = path.join(dirname, "view", "dist");
console.log(files);

app.get("/api/query", (req, res) => {
  res.send({ message: "user query" });
});

app.use(express.static(path.join(dirname, "view", "dist")));

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
