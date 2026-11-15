import compression from 'compression';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';

const app: Express = express();

app.use(compression());
app.use(helmet());

interface User {
    name: string;
}

interface Database {
    users: Map<string, User>;
}

const database: Database = {
    users: new Map(),
};

database.users.set('POTUS', {
    name: "Emilio Morejon",
});

app.get('/user/:id', (req: Request, res: Response) => {
    const username = req.params.id as string;
    if (database.users.has(username)) {
        const user = database.users.get(username)!;
        res.send(`User{ username = ${username}, name = ${user.name} }`);
    } else {
        res.sendStatus(404);
    }
});

app.listen(8080);