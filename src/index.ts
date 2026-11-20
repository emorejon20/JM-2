import assert from 'assert';

import compression from 'compression';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import pino from 'pino';
import { validate } from '@hyperjump/json-schema/draft-2020-12';
import pinoHttp from 'pino-http';

import db from './db.ts';

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

const validateUser = await validate('./static/schemas/user.schema.json');

app.use(express.static('./static'));

app.route('/user')
    .options(async (req: Request, res: Response) => {
        res.setHeader('Allow', ['GET', 'POST']).sendStatus(200);
    })
    .get(async (req: Request, res: Response) => {
        const query = await db`SELECT * FROM "user";`;
        res.json(query);
    })
    .post(async (req: Request, res: Response) => {
        if (req.body !== undefined) {
            const bodyValidation = validateUser(req.body);
            if (!bodyValidation.valid) {
                res.sendStatus(422);
                return;
            }
            const username = req.body.username as string;
            var query =
                await db`SELECT * FROM "user" WHERE username = ${username};`;
            if (query.count > 0) {
                res.sendStatus(409);
                return;
            }
            const name = req.body.name as string;
            await db`INSERT INTO "user" VALUES (
                ${username},
                ${name}
            );`;
            res.location(`/user/${username}`).sendStatus(303);
            return;
        }
        res.sendStatus(400);
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
        var query =
            await db`SELECT * FROM "user" WHERE username = ${username};`;
        if (query.count > 0) {
            res.json(query[0]);
            return;
        }
        res.sendStatus(404);
    })
    .put(async (req: Request, res: Response) => {
        const username = req.params.username as string;
        if (req.body !== undefined) {
            const bodyValidation = validateUser(req.body);
            const newUsername = req.body.username as string;
            const newName = req.body.name as string;
            var query =
                await db`SELECT * FROM "user" WHERE username = ${username};`;
            if (query.count == 0) {
                res.sendStatus(404);
                return;
            }
            if (!bodyValidation.valid) {
                res.sendStatus(422);
                return;
            }
            if (username != newUsername) {
                query =
                    await db`SELECT * FROM "user" WHERE username = ${newUsername};`;
                if (query.count > 0) {
                    res.sendStatus(409);
                    return;
                }
                await db`DELETE FROM "user" WHERE username = ${username};`;
                await db`INSERT INTO "user" VALUES (
                    ${newUsername},
                    ${newName}
                );`;
                res.location(`/user/${newUsername}`).sendStatus(303);
                return;
            }
            await db`UPDATE "user" SET name = ${newName} WHERE username = ${username}`;
            res.location(`/user/${req.body.username as string}`).sendStatus(
                303,
            );
            return;
        }
        res.sendStatus(400);
    })
    .delete(async (req: Request, res: Response) => {
        const username = req.params.username as string;
        const query =
            await db`DELETE FROM "user" WHERE username = ${username};`;
        if (query.count > 0) {
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
