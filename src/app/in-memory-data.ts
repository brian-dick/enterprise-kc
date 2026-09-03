import { InMemoryDbService } from 'angular-in-memory-web-api';

export interface User {
	id: number;
	FirstName: string;
	LastName: string;
}

export interface Task {
	id: number;
	Title: string;
	Description: string;
	AssignedToUserID: number | null;
	DateEntered: string;
	DateCompleted: string | null;
}

export class InMemoryData implements InMemoryDbService {
	createDb() {
		const users: User[] = [
			{ id: 1, FirstName: 'Brian', LastName: 'Dick' },
			{ id: 2, FirstName: 'RJ', LastName: 'Pericola' },
		];
		const tasks: Task[] = [];

		return { users, tasks };
	}

	genId<T extends { id: number }>(collection: T[]): number {
		return collection.length > 0
			? Math.max(...collection.map((item) => item.id)) + 1
			: 1;
	}
}
