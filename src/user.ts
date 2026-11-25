import { type Row } from 'postgres';

export default class User {
    public readonly handle: string;
    public readonly name: string;
    public readonly createdAt;

    public static fromRow(row: Row): User {
        return new User(row['handle'], row['name'], row['created_at']);
    }

    public constructor(handle: string, name: string, createdAt: Date) {
        this.handle = handle;
        this.name = name;
        this.createdAt = createdAt;
    }
}
