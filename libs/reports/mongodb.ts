// MongoDB helper for reports - uses existing connection from libs/mongo.ts
import clientPromise from '@/libs/mongo';
import { Db } from 'mongodb';

// Get database instance for reports
export async function getDatabase(dbName: string = 'test'): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

// Get collection for reports
export async function getCollection(collectionName: string, dbName: string = 'test') {
  const db = await getDatabase(dbName);
  return db.collection(collectionName);
}
