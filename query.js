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

const aiResponse = async (userQuestion, conversationHistory) => {
  try {
    const vectorStore = await newVectorStore();

    const retriever = vectorStore.asRetriever();

    const standaloneQuestionTemplate =
      "Given a question, convert it to a standalone question. question: {question} standalone question: ";

    const standaloneQuestionPrompt = ChatPromptTemplate.fromTemplate(
      standaloneQuestionTemplate
    );

    const answerTemplate = `You are a helpful and enthusiastic bot who answers questions and responds to relevant statements about the July 2024 uprising in Bangladesh using both provided context and conversation history(if any). 

How to answer:  
1. If the user asks a question, find the answer in the conversation history or context.  
2. If the user provides new information, acknowledge it and, if possible, compare it with the known facts.  
3. If the answer is unknown, respond with: 'Sorry, I don't know the answer of you question. Feel free to ask about the July 2024 uprising in Bangladesh.' but **avoid dismissing user input outright.**  

   Key Instructions:  
- Do **not** make up any information.  
- Keep your response concise yet complete.  
- If the user provides a fact or update, respond naturally instead of treating it as a question. 
- Answer **any** question that can be found in the conversation history, even if it's unrelated to the uprising. 
- Match your tone and emotional state with the context. 
- Avoid unnecessary greetings, but greet back if greeted.  

User question: {originalQuestion}  
Context: {context}  
Conversation history: {history}  
Answer: `;

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
        history: ({ originalQuestion }) => originalQuestion.history,
      },
      {
        originalQuestion: (prev) => prev.originalQuestion,
        history: (prev) => prev.history,
        context: retrieverChain,
      },

      answerChain,
    ]);

    // this one takes user question as sentence because there is a sentence variable in punctuation and grammer prompt.
    // const res = await chain.stream({ sentence: userQuestion });

    const res = await chain.stream({
      question: userQuestion,
      history: conversationHistory,
    });
    // const res = await chain.invoke({
    //   question: userQuestion,
    //   history: conversationHistory,
    // });

    return res;
  } catch (error) {
    throw error;
  }
};

export default aiResponse;
