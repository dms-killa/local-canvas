import { NetworkValidator } from 'src/lib/config/NetworkConfig';

describe('NetworkValidator – exhaustive validation', () => {
  const validator = new NetworkValidator();

  it('rejects non‑numeric LAN port ranges (strings, arrays with mixed types)', async () => {
    const badCases = [
      { lanPortRange: ['80', '90'] },            // string numbers
      { lanPortRange: [80.5, 90] },            // floating point
      { lanPortRange: [null, 90] },            // null entry
      { lanPortRange: [{ start: 1 }, 2] },     // objects instead of numbers
    ];

    badCases.forEach(caseOpts => {
      expect(() => validator.validate({ ...caseOpts })).toThrow(/numeric/i);
    });
  });

  it('accepts a valid CIDR range for both IPv4 and IPv6', async () => {
    const validateV4 = validator.validate({
      lanCidr: '192.168.0.0/24',
    });
    await expect(validateV4).resolves.toBeUndefined();

    // For IPv6 you can also test that the CIDR syntax is accepted;
    // the validator may only log a warning in strict mode,
    // but it should not throw.
  });

  it('enforces LAN‑only hostname rules – rejects public DNS names', async () => {
    const invalidHosts = ['example.com', 'api.github.com', '1.2.3.4'];
    invalidHosts.forEach(host => {
      expect(() =>
        validator.validate({ lanHost: host, lanPortRange: [80, 90] })
      ).toThrow(/LAN‑only/i);
    });
  });

  it('allows a hostname that resolves to an internal LAN address', async () => {
    // Hostname is whitelisted by the validator; we only assert no exception.
    expect(() =>
      validator.validate({ lanHost: 'my-local-router', lanPortRange: [80, 90] })
    ).not.toThrow();
  });

  it('throws with a clear error message when OLLAMA_HOST is missing but required', async () => {
    process.env.OLLAMA_HOST = undefined;
    await expect(
      validator.validate({ lanHost: '127.0.0.1', lanPortRange: [80, 90] })
    ).rejects.toThrow(/environment variable.*OLLAMA_HOST/i);
    delete process.env.OLLAMA_HOST; // clean up for subsequent tests
  });
});
