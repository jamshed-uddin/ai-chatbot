import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const llm = () => {
  const googleApiKey = process.env.GOOGLE_API_KEY;

  const llm = new ChatGoogleGenerativeAI({
    apiKey: googleApiKey,
    model: "gemini-2.0-flash",
  });

  return llm;
};

export default llm;
