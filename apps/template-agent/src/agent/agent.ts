import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { Config } from "../utils/config";
import { createTools } from "./tools";
import { SYSTEM_PROMPT } from "./prompt";

/**
 * AGENT CLASS WRAPPER
 * 
 * This class encapsulates the LangChain agent logic. 
 * It must expose an 'invoke' method for standard message processing.
 * 
 * ARCHITECTURE NOTE:
 * We use 'createAgent' which is part of the LangChain V1 / LangGraph ecosystem.
 * This provides a production-ready foundation with built-in state management.
 * 
 * DEBUG TIP: 
 * If you encounter "Type instantiation is excessively deep and possibly infinite" errors:
 * Cast 'model' as 'any' and 'tools' as 'any[]' in the createAgent configuration.
 */
export class CustomAgent {
  private agent: any;

  constructor(config: Config) {
    // 1. Initialize the LLM (OpenAI by default)
    const model = new ChatOpenAI({
      apiKey: config.openai.api_key,
      modelName: config.openai.model,
      temperature: 0,
    });

    // 2. Load the tools defined in tools.ts
    const tools = createTools(config);

    // 3. Instantiate the agent with model, tools, and system prompt
    this.agent = createAgent({
      model: model as any,
      tools: tools as any[],
      systemPrompt: SYSTEM_PROMPT,
    });
  }

  /**
   * Processes user input through the agent.
   * @param userInput The raw text input from the user.
   * @returns The agent's generated response as a string.
   */
  async invoke(userInput: string): Promise<string> {
    const result = await this.agent.invoke({
      messages: [new HumanMessage(userInput)],
    });

    // Extract content from the final message in the chain
    const lastMessage = result.messages[result.messages.length - 1];
    return lastMessage.content.toString();
  }
}

