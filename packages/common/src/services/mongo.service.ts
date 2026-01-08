import { MongoClient, Db, Collection, Document } from 'mongodb';

export class MongoService {
  private client?: MongoClient;
  private db?: Db;

  async connect(uri: string, dbName: string) {
    this.client = await MongoClient.connect(uri);
    this.db = this.client.db(dbName);
    console.log(`Connected to MongoDB: ${dbName}`);
  }

  getCollection<T extends Document>(name: string): Collection<T> {
    if (!this.db) throw new Error('MongoDB not connected');
    return this.db.collection<T>(name);
  }

  async close() {
    await this.client?.close();
  }
}

