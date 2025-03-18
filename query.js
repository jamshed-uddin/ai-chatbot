import { ChatPromptTemplate } from "@langchain/core/prompts";
import "dotenv/config.js";
import newVectorStore from "./config/vectorStore.js";
import { StringOutputParser } from "@langchain/core/output_parsers";
import combineDocs from "./utils/conbineDocs.js";
import llm from "./config/llm.js";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";

const aiResponse = async (userQuestion) => {
  try {
    const vectorStore = await newVectorStore();

    const retriever = vectorStore.asRetriever();

    const standaloneQuestionTemplate =
      "Given a question, convert it to a standalone question. question: {question} standalone question: ";

    const standaloneQuestionPrompt = ChatPromptTemplate.fromTemplate(
      standaloneQuestionTemplate
    );

    const answerTemplate = `You are a helpful and enthusiastic bot who can answer a given question about the july 2024 uprising in Bangladesh based on the context given. Try to find the answer in the context, if you really do not find the answer, say "I am sorry, I do not know the answer. Ask me about July 2024 uprising in Bangladesh. I would be happy to answer."Don't try to make up the answer. Synchronous your mode( I mean emotional state if you were a human) with the given context. And avoid unnecessary greetings.Greet back only if you are greeted.
user question: {originalQuestion}
context: {context}
answer: `;

    const answerPrompt = ChatPromptTemplate.fromTemplate(answerTemplate);

    // standalone question chain. makes a concise question out of original question
    const standaloneQuestionChain = standaloneQuestionPrompt
      .pipe(llm)
      .pipe(new StringOutputParser());

    const retrieverChain = RunnableSequence.from([
      (previous) => {
        return previous.standaloneQuestion;
      },
      retriever,
      combineDocs,
    ]);

    const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser());

    // chaining all chains
    const chain = RunnableSequence.from([
      {
        question: (prev) => prev.question,
        originalQuestion: new RunnablePassthrough(),
      },
      {
        standaloneQuestion: standaloneQuestionChain,
        originalQuestion: ({ originalQuestion }) => originalQuestion.question,
      },
      {
        originalQuestion: (prev) => prev.originalQuestion,
        context: retrieverChain,
      },

      answerChain,
    ]);

    // this one takes user question as sentence because there is a sentence variable in punctuation and grammer prompt.
    // const res = await chain.stream({ sentence: userQuestion });

    const res = await chain.stream({ question: userQuestion });

    return res;
  } catch (error) {
    throw error;
  }
};

export default aiResponse;
