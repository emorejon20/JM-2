import assert from 'assert';

assert(process.env.DB_CONNECTION_URL !== undefined);
assert(process.env.PORT !== undefined);

export const db_connection_url = process.env.DB_CONNECTION_URL;
export const port = parseInt(process.env.PORT);
