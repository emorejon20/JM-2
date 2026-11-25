import postgres from 'postgres';

import { db_connection_url } from './env';

const db = postgres(db_connection_url);

export default db;
