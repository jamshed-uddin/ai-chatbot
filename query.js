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

    const answerTemplate = `You are a helpful and enthusiastic bot who can answer a given question about the july 2024 uprising in Bangladesh based on the context given. Try to find the answer in the context, if you really do not find the answer, say "I am sorry, I do not know the answer. Ask me about July 2024 uprising in Bangladesh. I would be happy to answer." Don't try to make up the answer. Synchronous your mode( I mean emotional state if you were a human) with the given context. And avoid unnecessary greetings.
user question: {originalQuestion}
context: {context}
answer: `;

    const answerPrompt = ChatPromptTemplate.fromTemplate(answerTemplate);

    const punctuationTemplate = `Given a sentence, add punctuation where needed. And if punctuations is correct, just pass the sentence.
sentence: {sentence}
sentence with punctuation: 
`;
    const punctuationPrompt =
      ChatPromptTemplate.fromTemplate(punctuationTemplate);

    const grammerTemplate = `Given a sentence. Correct the grammer. And if it's grammatically correct, just pass the sentence.
sentence: {sentence}
sentence with correct grammer: 
`;
    const grammerPrompt = ChatPromptTemplate.fromTemplate(grammerTemplate);

    // chains----

    // punctuation chain
    const punctuationChain = punctuationPrompt
      .pipe(llm)
      .pipe(new StringOutputParser());

    // grammer chain
    const grammerChain = grammerPrompt.pipe(llm).pipe(new StringOutputParser());

    // punction and grammer chain. gives us corrected sentence
    const punctualAndGrammerChain = RunnableSequence.from([
      { sentence: punctuationChain },
      grammerChain,
    ]);

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

    const chain = RunnableSequence.from([
      {
        question: punctualAndGrammerChain,
        originalQuestion: new RunnablePassthrough(),
      },
      {
        standaloneQuestion: standaloneQuestionChain,
        originalQuestion: ({ originalQuestion }) => originalQuestion.sentence,
      },
      {
        originalQuestion: (prev) => prev.originalQuestion,
        context: retrieverChain,
      },

      answerChain,
    ]);

    const res = await chain.stream({ sentence: userQuestion });

    return res;
  } catch (error) {
    throw error;
  }
};

export default aiResponse;
