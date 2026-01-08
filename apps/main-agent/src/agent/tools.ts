import { NatsService, SlackContext, AGENT_SUBJECT_PREFIX } from "@agent-workshop/common";
import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const createTools = (natsService: NatsService, slackContext: SlackContext) => {
  const searchSchema = z.object({
    query: z.string().describe("The query to search for"),
  });

  const search = tool(
    async ({ query }: { query: string }) => {
      return `Results for: ${query}`;
    },
    {
      name: "search",
      description: "Search for information",
      schema: searchSchema as any,
    }
  );

  const publishSchema = z.object({
    category: z.string().describe("Category name of the requirement"),
    subjectSuffix: z.string().describe("Corresponding NATS subject suffix"),
    content: z.string().describe("Original request content sent to this category"),
  });

  const publishToNats = tool(
    async ({ category, subjectSuffix, content }: { category: string; subjectSuffix: string; content: string }) => {
      const requestId = `req_${Date.now()}`;
      const fullSubject = `${AGENT_SUBJECT_PREFIX}${subjectSuffix}`;
      
      await natsService.publish(fullSubject, {
        requestId,
        category,
        text: content,
        slackContext,
      });
      return `Request dispatched to [${category}] category (Full Subject: ${fullSubject}). Request ID: ${requestId}`;
    },
    {
      name: "publish_to_nats",
      description: "Use when the user's requirement belongs to a specific category that has a corresponding NATS subject suffix.",
      schema: publishSchema as any,
    }
  );

  return [search, publishToNats] as any[];
};
