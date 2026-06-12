import { ServiceUnavailableException } from '@nestjs/common';
import { NullSportsDataProvider } from './null-sports-data.provider';

describe('NullSportsDataProvider', () => {
  const provider = new NullSportsDataProvider();

  it('se identifica como "none" y no configurado', () => {
    expect(provider.getProviderName()).toBe('none');
    expect(provider.isConfigured()).toBe(false);
  });

  it('lanza ServiceUnavailableException en getCompetitions', async () => {
    await expect(provider.getCompetitions()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('lanza ServiceUnavailableException en getTeams', async () => {
    await expect(provider.getTeams()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('lanza ServiceUnavailableException en getMatches', async () => {
    await expect(provider.getMatches()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
