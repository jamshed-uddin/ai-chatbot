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

app.post("/api/query", async (req, res) => {
  const { content } = req.body.userMessage;
  const { conversationHistory } = req.body;
  const response = await aiResponse(content, conversationHistory);
  console.log(response);

  res.status(200).send({
    content: response,
    sender: "assistant",
  });
});

app.use(express.static(path.join(dirname, "view", "dist")));
app.get("/", (req, res) => {
  res.sendFile(path.resolve(dirname, "view", "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
