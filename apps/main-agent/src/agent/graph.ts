import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { NatsService, MongoService, IAgentCapability, SlackContext } from "@agent-workshop/common";
import { createTools } from "./tools";
import { Config } from "../utils/config";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export class AgentManager {
  private model: ChatOpenAI;

  constructor(
    private natsService: NatsService,
    private mongoService: MongoService,
    private config: Config
  ) {
    this.model = new ChatOpenAI({
      apiKey: this.config.openai.api_key,
      modelName: this.config.openai.model,
      temperature: 0,
    });
  }

  private async getCapabilities(): Promise<IAgentCapability[]> {
    const collection = this.mongoService.getCollection<IAgentCapability>(this.config.mongodb.collection_name);
    return await collection.find({}).toArray();
  }

  async run(userInput: string, slackContext: SlackContext) {
    // 1. Get all capabilities currently registered in the system
    const capabilities = await this.getCapabilities();
    
    // 2. Prepare tools
    const tools = createTools(this.natsService, slackContext);
    
    // 3. Build system prompt to inform Agent of available categories
    const capabilitiesDesc = capabilities
      .map(c => `- Category: ${c.name}, Description: ${c.description}, SubjectSuffix: ${c.subjectSuffix}`)
      .join('\n');

    const systemMessage = new SystemMessage(`You are an intelligent routing Agent.
Your task is to analyze user conversation requests:
1. If the user's requirement matches one of the known categories below, call 'publish_to_nats' tool for dispatching, providing the corresponding SubjectSuffix.
2. If it doesn't match any known category, respond directly to the user or engage in conversation.

Current available categories:
${capabilitiesDesc || "No categories available"}

Please make an accurate judgment based on the semantics of the user request.`);

    // 4. Create React Agent (LangGraph V1/V0.3 equivalent implementation)
    const agent = createAgent({
      model: this.model,
      tools: tools as any[],
    });

    // 5. Execute Agent
    const result = await agent.invoke({
      messages: [systemMessage, new HumanMessage(userInput)],
    });

    // Return the content of the last message
    const lastMessage = result.messages[result.messages.length - 1];
    return lastMessage.content.toString();
  }
}

