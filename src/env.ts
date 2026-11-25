import assert from 'assert';

export enum Environment {
    Production,
    Development,
}

assert(process.env.NODE_ENV !== undefined);
assert(process.env.DB_CONNECTION_URL !== undefined);
assert(process.env.PORT !== undefined);

export let environment: Environment;
switch (process.env.NODE_ENV) {
    case 'development':
        environment = Environment.Development;
        break;
    case 'production':
        environment = Environment.Production;
        break;
}
export const db_connection_url = process.env.DB_CONNECTION_URL;
export const port = parseInt(process.env.PORT);
