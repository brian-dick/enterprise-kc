import { InMemoryData } from './in-memory-data';

describe('InMemoryData', () => {
  const service = new InMemoryData();

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create the users and tasks collections', () => {
    const database = service.createDb();

    expect(database.users).toEqual([
      { id: 1, FirstName: 'Brian', LastName: 'Dick' },
      { id: 2, FirstName: 'RJ', LastName: 'Pericola' },
    ]);
    expect(database.tasks).toEqual([]);
  });

  it('should generate the next identity value', () => {
    expect(service.genId([{ id: 2 }, { id: 7 }])).toBe(8);
    expect(service.genId([])).toBe(1);
  });
});
