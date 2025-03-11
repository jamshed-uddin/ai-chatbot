import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import fs from "fs";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

try {
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

  const text = fs.readFileSync("july-uprising.txt", "utf-8");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    separators: ["\n\n", "\n", " ", ""],
    chunkOverlap: 50,
  });
  const output = await splitter.createDocuments([text]);
  console.log(output.length);
} catch (error) {}
