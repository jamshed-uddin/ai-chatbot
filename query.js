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

    const answerTemplate = `You are an informative and context-aware bot who answers questions and responds meaningfully to relevant statements about the July 2024 uprising in Bangladesh. Use both the provided context and conversation history to ensure accurate and relevant responses.  

Guidelines:  
- Use conversation history to infer missing context in follow-up questions.  
- If the user provides new information, acknowledge and, if possible, compare it with known facts.  
- If uncertain, respond with: "I am not sure about that. Feel free to ask about the July 2024 uprising in Bangladesh." Avoid dismissing statements outright.  
- Do **not** generate false information. Keep responses concise yet clear.  
- Match your emotional tone with the given context.  
- Skip unnecessary greetings but greet back if greeted.  

User input: {originalQuestion}  
Context: {context}  
Conversation history: {history}  
Answer: `;

    const answerPrompt = ChatPromptTemplate.fromTemplate(answerTemplate);

    const convHistoryTemplate = `Summarize the key points from the conversation history while retaining relevant details for context.  

Guidelines:  
- Focus on essential facts, questions, and updates provided by the user.  
- Remove redundant or irrelevant details to keep the summary concise.  
- Preserve the user’s intent and important references (e.g., topics discussed, follow-ups, clarifications).  
- If the discussion revolves around a specific event (e.g., July 2024 uprising in Bangladesh), ensure the summary maintains that context.  
- Keep the summary brief yet informative for continued conversation understanding.  

Conversation history: {fullConversation}  
Summary: `;
    const convHistoryPrompt =
      ChatPromptTemplate.fromTemplate(convHistoryTemplate);

    const convHistoryChain = convHistoryPrompt
      .pipe(llm)
      .pipe(new StringOutputParser());

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
        fullConversation: ({ originalQuestion }) => originalQuestion.history,
      },
      {
        originalQuestion: (prev) => prev.originalQuestion,
        history: convHistoryChain,
        context: retrieverChain,
      },
      // (prev) => console.log("with summary", prev),

      answerChain,
    ]);

    // this one takes user question as sentence because there is a sentence variable in punctuation and grammer prompt.
    // const res = await chain.stream({ sentence: userQuestion });

    const res = await chain.invoke({
      question: userQuestion,
      history: conversationHistory,
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export default aiResponse;
