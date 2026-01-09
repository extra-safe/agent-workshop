import { connect, NatsConnection, JSONCodec, ConnectionOptions } from 'nats';
import { NatsRegistrationMessage } from '../models/types';

export class NatsService {
  private nc?: NatsConnection;
  private jc = JSONCodec();

  async connect(url: string) {
    const options: ConnectionOptions = { servers: url };
    
    // Attempt to parse username and password from URL to prevent parsing issues in some environments
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.username) options.user = decodeURIComponent(parsedUrl.username);
      if (parsedUrl.password) options.pass = decodeURIComponent(parsedUrl.password);
    } catch (e) {
      // If not a valid URL (e.g., only host:port), ignore
    }

    this.nc = await connect(options);
    console.log(`Connected to NATS at ${url}`);
  }

  async publish(subject: string, data: any) {
    if (!this.nc) throw new Error('NATS not connected');
    this.nc.publish(subject, this.jc.encode(data));
  }

  async registerAgent(registrationSubject: string, agentInfo: NatsRegistrationMessage) {
    console.log(`Registering agent [${agentInfo.name}] on subject [${registrationSubject}]`);
    await this.publish(registrationSubject, agentInfo);
  }

  async subscribe(subject: string, callback: (data: any) => void) {
    if (!this.nc) throw new Error('NATS not connected');
    const sub = this.nc.subscribe(subject);
    for await (const m of sub) {
      callback(this.jc.decode(m.data));
    }
  }

  async close() {
    await this.nc?.close();
  }
}

