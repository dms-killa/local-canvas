export default class OllamaHealthMonitor {
  // No-op; just records that start was called.
  start = jest.fn().mockImplementation(() => Promise.resolve());

  stop = jest.fn().mockImplementation(() => Promise.resolve());
}
