import "dotenv/config.js";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import fs from "fs";

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

try {
  // fetching page data from wikipedia---------
  //   const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=true&titles=July_Revolution_(Bangladesh)&origin=*`;

  //   fetch(url)
  //     .then((res) => res.json())
  //     .then((data) => {
  //       const pages = data.query.pages;
  //       const pageId = Object.keys(pages)[0]; // Get page ID dynamically
  //       console.log(
  //         pages[pageId].extract
  //           .replace(/==+/g, "") // Remove "== Heading ==" symbols
  //           .replace(/\n+/g, "\n") // Normalize multiple newlines
  //           .trim()
  //       ); // Wikipedia page content
  //     })
  //     .catch((error) => console.error("Error fetching data:", error));

  // get the txt from files
  const text = fs.readFileSync("july-uprising.txt", "utf-8");

  //   split the text
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    separators: ["\n\n", "\n", " ", ""],
    chunkOverlap: 50,
  });
  //   splitted txt file
  const output = await splitter.createDocuments([text]);

  const googleApiKey = process.env.GOOGLE_API_KEY;

  //   instantiate google gen ai embeddings
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: googleApiKey,
    model: "text-embedding-004",
  });

  //   direct use of google gen ai embeddings
  // const embeded = await embeddings.embedDocuments()
  // console.log(embeded);

  //   instantiate pinecone client
  const pinecone = new PineconeClient();

  //   pinecone index
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);
  //   vector store
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });

  await vectorStore.addDocuments(output);
} catch (error) {
  console.log(error);
}
