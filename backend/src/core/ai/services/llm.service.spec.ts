import { LlmService } from './llm.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LlmService', () => {
  let service: LlmService;

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'dummy-key-for-testing';
    service = new LlmService();
  });

  it('parses direct JSON response', async () => {
    const fakeResponse = { choices: [{ message: { content: '{"action":"SEARCH","query":"test"}' } }] };
  mockedAxios.post.mockResolvedValueOnce({ data: fakeResponse, status: 200, statusText: 'OK', headers: {}, config: {} as any });

    const parsed = await service.understandQuery('find test');
    expect(parsed).toHaveProperty('action', 'SEARCH');
  });

  it('extracts JSON from mixed text', async () => {
    const mixed = 'Sure\nSome explanation\n{"action":"DELETE","deleteData":{"id":"5"}}\nThanks';
    const fakeResponse = { choices: [{ message: { content: mixed } }] };
  mockedAxios.post.mockResolvedValueOnce({ data: fakeResponse, status: 200, statusText: 'OK', headers: {}, config: {} as any });

    const parsed = await service.understandQuery('delete item 5');
    expect(parsed).toHaveProperty('action', 'DELETE');
    expect(parsed.deleteData?.id).toBe('5');
  });
});
