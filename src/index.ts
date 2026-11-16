import compression from 'compression';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';

const port = 8080;

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
    name: string;
}

interface Database {
    users: Map<string, User>;
}

const database: Database = {
    users: new Map(),
};

app.route('/user')
    .options(async (req: Request, res: Response) => {
        res.setHeader('Allow', 'POST').sendStatus(200);
    })
    .post(async (req: Request, res: Response) => {
        if (req.body !== undefined) {
            const userUsername = req.body.username;
            const userName = req.body.name;
            if (
                userUsername === undefined ||
                typeof userUsername !== 'string' ||
                userName === undefined ||
                typeof userName !== 'string'
            ) {
                res.sendStatus(422);
            } else if (database.users.has(userUsername)) {
                res.sendStatus(409);
            } else {
                database.users.set(userUsername, {
                    name: userName,
                });
                res.location(`/user/${userUsername}`).sendStatus(303);
            }
        } else {
            res.sendStatus(400);
        }
    });

app.route('/user/:username')
    .options(async (req: Request, res: Response) => {
        res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']).sendStatus(
            200,
        );
    })
    .get(async (req: Request, res: Response) => {
        const username = req.params.username as string;
        if (database.users.has(username)) {
            const user = database.users.get(username)!;
            res.send(`User{ username = ${username}, name = ${user.name} }`);
        } else {
            res.sendStatus(404);
        }
    })
    .put(async (req: Request, res: Response) => {
        const username = req.params.username as string;
        if (req.body !== undefined) {
            const newUsername = req.body.username;
            const newName = req.body.name;
            if (
                newUsername === undefined ||
                typeof newUsername === 'string' ||
                newName === undefined ||
                typeof newName !== 'string'
            ) {
                res.sendStatus(422);
            } else if (!database.users.has(username)) {
                res.sendStatus(404);
            } else if (database.users.has(newUsername)) {
                res.sendStatus(409);
            } else {
                database.users.delete(username);
                database.users.set(newUsername, {
                    name: newName,
                });
                res.location(`/user/${newUsername}`).sendStatus(303);
            }
        } else {
            res.sendStatus(400);
        }
    })
    .patch(async (req: Request, res: Response) => {
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
    })
    .delete(async (req: Request, res: Response) => {
        const username = req.params.id as string;
        if (database.users.has(username)) {
            database.users.delete(username);
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    });

logger.info(`Listening at localhost:${port}...`);
app.listen(port);
