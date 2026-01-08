import { NatsService, MongoService, IAgentCapability, NatsRegistrationMessage } from '@agent-workshop/common';
import { Config } from '../utils/config';

export class RegistrationWorker {
  constructor(
    private nats: NatsService,
    private mongo: MongoService,
    private config: Config
  ) {}

  async start() {
    const subject = this.config.nats.subject_registration;
    console.log(`Registration Worker started, listening on: ${subject}`);
    
    await this.nats.subscribe(subject, async (data: NatsRegistrationMessage) => {
      try {
        console.log('Received registration request:', data);
        
        const collection = this.mongo.getCollection<IAgentCapability>(this.config.mongodb.collection_name);
        
        // Use name as unique identifier for upsert
        await collection.updateOne(
          { name: data.name },
          { 
            $set: { 
              description: data.description, 
              subjectSuffix: data.subjectSuffix,
              updatedAt: new Date()
            } 
          },
          { upsert: true }
        );
        
        console.log(`Capability [${data.name}] successfully registered with suffix [${data.subjectSuffix}].`);
      } catch (error) {
        console.error('Error processing registration:', error);
      }
    });
  }
}

