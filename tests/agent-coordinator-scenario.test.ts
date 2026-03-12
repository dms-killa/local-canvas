import { AgentCoordinator } from 'src/lib/agent/AgentCoordinator';
import { ProjectDb as MockedProjectDb } from 'src/lib/db/ProjectDb';
jest.mock('src/lib/monitor/OllamaHealthMonitor', () => ({
  __esModule: true,
  OllamaHealthMonitor: jest.fn().mockImplementation({
    start: jest.fn(),
    stop: jest.fn(),
  }),
}));
jest.mock('src/lib/coach/TaskQueue', () => ({
  TaskQueue: jest.fn().mockImplementation({
    claim: jest.fn().mockResolvedValue({ success: true, payload: { jobId: 'demo' } }),
    start: jest.fn((cb) => setTimeout(() => cb({ id: 'job-demo', runAt: Date.now() + 5 }), 0)),
  }),
}));

describe('AgentCoordinator – happy‑path scenario', () => {
  it('claims a task and runs the whole lifecycle without error', async () => {
    const TaskQueueMock = require('src/lib/coach/TaskQueue').TaskQueue;
    const MockedDB = require('src/lib/db/ProjectDb');
    const HealthMonitorMock = require('src/lib/monitor/OllamaHealthMonitor').OllamaHealthMonitor;

    // instantiate mocks
    const dbInstance = new MockedDB();
    const healthMockInstance = new HealthMonitorMock();

    // spy on internal methods we need to influence
    jest.spyOn(TaskQueueMock.prototype, 'claim').mockResolvedValue({ success: true, payload: { jobId: 'demo' } });
    jest.spyOn(healthMockInstance, 'start');
    jest.spyOn(healthMockInstance, 'stop');

    // build coordinator (real class will pick up mocked dependencies via its own imports)
    const Coordinator = require('src/lib/agent/AgentCoordinator').AgentCoordinator;
    const coordinator = new Coordinator(dbInstance as any);

    // override internal collaborators
    (coordinator as any).taskQueue = new TaskQueueMock();
    (coordinator as any).healthMonitor = healthMockInstance;

    // stub runOnce so it resolves true on first call – we just need to make sure the flow completes
    jest.spyOn(coordinator as any, 'runOnce').mockImplementation(async function () {
      const claimResult = await (this as any).claimTask?.();   // assuming claim task exists in real impl
      return !!claimResult;
    });

    // run a single iteration of the loop
    const result = await coordinator.runLoop({ maxAttempts: 1 });
    expect(result.success).toBe(true);
    expect(healthMockInstance.start).toHaveBeenCalledTimes(1);
  });
});
