import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

const newVectorStore = async () => {
  const googleApiKey = process.env.GOOGLE_API_KEY;

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: googleApiKey,
    model: "text-embedding-004",
  });

  const pinecone = new PineconeClient();
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });

  return vectorStore;
};

export default newVectorStore;
