import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { simulations } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

const result = await db.select().from(simulations).where(eq(simulations.id, 1170001)).limit(1);

console.log('=== Simulação #1170001 ===');
console.log(JSON.stringify(result, null, 2));
