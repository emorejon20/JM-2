import assert from 'assert';

import compression from 'compression';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import pino from 'pino';
import { validate } from '@hyperjump/json-schema/draft-2020-12';
import pinoHttp from 'pino-http';

assert(process.env.PORT !== undefined);
const port = parseInt(process.env.PORT);

const logger = pino();

const app = express();

app.use(compression());
app.use(helmet());
app.use(express.json());
app.use(express.raw());
app.use(
    pinoHttp({
        logger: logger,
    }),
);

interface User {
    username: string;
    name: string;
}

interface Database {
    users: Map<string, User>;
}

const database: Database = {
    users: new Map(),
};

const validateUser = await validate('./static/schemas/user.schema.json');

app.use(express.static('./static'));

app.route('/user')
    .options(async (req: Request, res: Response) => {
        res.setHeader('Allow', ['GET', 'POST']).sendStatus(200);
    })
    .get(async (req: Request, res: Response) => {
        res.json(database.users.values().toArray());
    })
    .post(async (req: Request, res: Response) => {
        if (req.body !== undefined) {
            const bodyValidation = validateUser(req.body);
            if (!bodyValidation.valid) {
                res.sendStatus(422);
            } else if (database.users.has(req.body.username as string)) {
                res.sendStatus(409);
            } else {
                database.users.set(req.body.username as string, {
                    username: req.body.username as string,
                    name: req.body.name as string,
                });
                res.location(`/user/${req.body.username as string}`).sendStatus(
                    303,
                );
            }
        } else {
            res.sendStatus(400);
        }
    })
    .all(async (req: Request, res: Response) => {
        res.sendStatus(405);
    });

app.route('/user/:username')
    .options(async (req: Request, res: Response) => {
        res.setHeader('Allow', [
            'GET',
            'PUT',
            /* 'PATCH', */ 'DELETE',
        ]).sendStatus(200);
    })
    .get(async (req: Request, res: Response) => {
        const username = req.params.username as string;
        if (database.users.has(username)) {
            const user = database.users.get(username)!;
            res.json(user);
        } else {
            res.sendStatus(404);
        }
    })
    .put(async (req: Request, res: Response) => {
        const username = req.params.username as string;
        if (req.body !== undefined) {
            const bodyValidation = validateUser(req.body);
            if (!database.users.has(username)) {
                res.sendStatus(404);
            } else if (!bodyValidation.valid) {
                res.sendStatus(422);
            } else if (database.users.has(req.body.username as string)) {
                res.sendStatus(409);
            } else {
                database.users.delete(username);
                database.users.set(req.body.username as string, {
                    username: req.body.username as string,
                    name: req.body.name as string,
                });
                res.location(`/user/${req.body.username as string}`).sendStatus(
                    303,
                );
            }
        } else {
            res.sendStatus(400);
        }
    })
    /*.patch(async (req: Request, res: Response) => {
        const username = req.params.username as string;
        if (req.body !== undefined) {
            if (!database.users.has(username)) {
                res.sendStatus(404);
            } else {
                var newUsername = req.body.username;
                var newName = req.body.name;
                if (
                    newUsername !== undefined &&
                    typeof newUsername === 'string'
                ) {
                    if (database.users.has(newUsername)) {
                        res.sendStatus(409);
                    }
                } else {
                    newUsername = username;
                }
                if (newName === undefined || typeof newName !== 'string') {
                    newName = database.users.get(username)!.name;
                }
                database.users.delete(username);
                database.users.set(newUsername, {
                    name: newName,
                });
                res.location(`/user/${newUsername}`).sendStatus(303);
            }
        } else {
            res.sendStatus(400);
        }
    })*/
    .delete(async (req: Request, res: Response) => {
        const username = req.params.username as string;
        console.log(username);
        if (database.users.has(username)) {
            database.users.delete(username);
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    })
    .all(async (req: Request, res: Response) => {
        res.sendStatus(405);
    });

app.use(async (req: Request, res: Response) => {
    res.sendStatus(404);
});

logger.info(`Listening at localhost:${port}...`);
app.listen(port);
