import compression from "compression";
import express, { type Express, type Request, type Response } from "express";
import helmet from "helmet";

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
  name: 'Emilio Morejon',
});

app.options("/user/:id", (req: Request, res: Response) => {
  res.setHeader("Allow", ["GET", "PUT", "PATCH", "DELETE"]).sendStatus(200);
});

app.get("/user/:id", (req: Request, res: Response) => {
  const username = req.params.id as string;
  if (database.users.has(username)) {
    const user = database.users.get(username)!;
    res.send(`User{ username = ${username}, name = ${user.name} }`);
  } else {
    res.sendStatus(404);
  }
});

app.put("/user/:id", (req: Request, res: Response) => {
    res.sendStatus(418);
})

app.patch("/user/:id", (req: Request, res: Response) => {
    res.sendStatus(418);
});

app.delete("/user/:id", (req: Request, res: Response) => {
  const username = req.params.id as string;
  if (database.users.has(username)) {
    database.users.delete(username);
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.listen(8080);
