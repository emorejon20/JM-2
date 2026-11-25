import compression from 'compression';
import express, {
    type Express,
    type NextFunction,
    type Request,
    type Response,
} from 'express';
import helmet from 'helmet';
import pino from 'pino';
import { validate } from '@hyperjump/json-schema/draft-2020-12';
import pinoHttp from 'pino-http';

import db from './db';
import { Environment, environment, port } from './env';
import User from './user';

const logger = pino({
    level: environment === Environment.Development ? 'debug' : 'info',
});

const validateUser = await validate('./static/schemas/user.schema.json');

const app = express();

app.use(compression())
    .use(helmet())
    .use(express.json())
    .use(
        pinoHttp({
            logger: logger,
        }),
    )
    .use(express.static('./static'));

app.route('/user')
    .options(async (req: Request, res: Response) => {
        res.setHeader('Allow', ['GET', 'POST']).sendStatus(200);
    })
    .get(async (req: Request, res: Response) => {
        const query = await db`SELECT handle, name, created_at FROM "user";`;
        res.json(query.map((row) => User.fromRow(row)));
    })
    .post(async (req: Request, res: Response) => {
        if (req.body !== undefined) {
            const bodyValidation = validateUser(req.body);
            if (!bodyValidation.valid) {
                logger.info(bodyValidation.errors!);
                res.status(422);
                return;
            }
            const handle = req.body.handle as string;
            var query =
                await db`SELECT handle FROM "user" WHERE handle = ${handle};`;
            if (query.count > 0) {
                res.sendStatus(409);
                return;
            }
            const name = req.body.name as string;
            await db`INSERT INTO "user" (handle, name) VALUES (
                    ${handle},
                    ${name}
                );`;
            res.location(`/user/${handle}`).sendStatus(303);
            return;
        }
        res.sendStatus(400);
    })
    .all(async (req: Request, res: Response) => {
        res.sendStatus(405);
    });

app.route('/user/:handle')
    .options(async (req: Request, res: Response) => {
        res.setHeader('Allow', [
            'GET',
            'PUT',
            /* 'PATCH', */ 'DELETE',
        ]).sendStatus(200);
    })
    .get(async (req: Request, res: Response) => {
        const handle = req.params.handle as string;
        var query =
            await db`SELECT handle, name, created_at FROM "user" WHERE handle = ${handle};`;
        if (query.count > 0) {
            res.json(User.fromRow(query[0]!));
            return;
        }
        res.sendStatus(404);
    })
    .put(async (req: Request, res: Response) => {
        const handle = req.params.handle as string;
        if (req.body !== undefined) {
            const bodyValidation = validateUser(req.body);
            const newHandle = req.body.handle as string;
            const newName = req.body.name as string;
            var query =
                await db`SELECT handle, name, created_at FROM "user" WHERE handle = ${handle};`;
            if (query.count === 0) {
                res.sendStatus(404);
                return;
            }
            if (!bodyValidation.valid) {
                res.sendStatus(422);
                return;
            }
            if (handle != newHandle) {
                query =
                    await db`SELECT handle, name, created_at FROM "user" WHERE handle = ${newHandle};`;
                if (query.count > 0) {
                    res.sendStatus(409);
                    return;
                }
                await db`DELETE FROM "user" WHERE handle = ${handle};`;
                await db`INSERT INTO "user" (handle, name) VALUES (
                    ${newHandle},
                    ${newName}
                );`;
                res.location(`/user/${newHandle}`).sendStatus(303);
                return;
            }
            await db`UPDATE "user" SET name = ${newName} WHERE handle" = ${handle}`;
            res.location(`/user/${req.body.handle as string}`).sendStatus(303);
            return;
        }
        res.sendStatus(400);
    })
    .delete(async (req: Request, res: Response) => {
        const handle = req.params.handle as string;
        const query = await db`DELETE FROM "user" WHERE handle = ${handle};`;
        if (query.count > 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    })
    .all(async (req: Request, res: Response) => {
        res.sendStatus(405);
    });

// Invalid route and error handlers
app.use(async (req: Request, res: Response) => {
    res.sendStatus(404);
}).use(async (err: Error, req: Request, res: Response, _: NextFunction) => {
    logger.error(err);
    res.sendStatus(500);
});

logger.info(`Listening at localhost:${port}...`);
app.listen(port);
