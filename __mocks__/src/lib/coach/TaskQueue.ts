export class TaskQueue {
  claim = jest.fn().mockImplementation(async () => ({
    success: true,
    payload: { jobId: 't-001', type: 'demo' },
  }));

  start(callback) {
    setTimeout(() => callback({ id: 'job-demo', runAt: Date.now() + 5 }), 0);
  }
}
