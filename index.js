import express from "express";
import "dotenv/config.js";
import path from "path";
import cors from "cors";
import aiResponse from "./query.js";

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT;

const dirname = path.resolve();
const files = path.join(dirname, "view", "dist");
console.log(files);

app.post("/api/query", async (req, res) => {
  console.log("hello");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "Keep-alive");
  console.log(req.body);
  const { content } = req.body.userMessage;
  const response = await aiResponse(content);
  console.log(response);
  for await (const chunk of response) {
    res.write(chunk);
  }
  res.end();
});

app.use(express.static(path.join(dirname, "view", "dist")));

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
