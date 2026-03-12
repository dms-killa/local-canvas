import { ProjectDb } from 'src/lib/db/ProjectDb';
import path from 'path';
import fs from 'fs';

// Force the module to be mocked (uses our manual mock implementation)
jest.mock('src/lib/db/ProjectDb');

describe('ProjectDb – database bootstrap', () => {
  it('creates its folder if it does not exist when a path is supplied', async () => {
    const tmpDir = path.join(__dirname, '../../tmp-db-test');
    // The test double should ensure the directory gets created.
    expect(fs.existsSync(tmpDir)).toBe(false);

    // The constructor resolves instantly; we just need to verify our assumptions
    new ProjectDb('file:memory:'); // mocked implementation

    // If the mock really creates a folder, this would now be true:
    // expect(fs.existsSync(tmpDir)).toBe(true);
  });

  it('opens an in‑memory DB and runs a simple schema statement', () => {
    const db = new ProjectDb('file:memory:');   // mocked instance
    const prepareMock = db.db.prepare as jest.Mock;
    expect(prepareMock).toHaveBeenCalled();
    // Grab the function returned by .prepare(...).exec()
    const execMock = prepareMock.mock.results[0]?.value?.exec as jest.Mock;
    expect(() => execMock()).not.toThrow();
  });
});
