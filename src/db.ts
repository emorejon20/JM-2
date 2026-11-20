import assert from 'assert';

import postgres from 'postgres';

assert(process.env.POSTGRESQL_CONNECTION_URI !== undefined);
const db = postgres(process.env.POSTGRESQL_CONNECTION_URI);

export default db;
