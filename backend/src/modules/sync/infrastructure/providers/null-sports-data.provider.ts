import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  ExternalCompetition,
  ExternalMatch,
  ExternalTeam,
  SportsDataProvider,
} from '../../domain/sports-data-provider.interface';

const NOT_CONFIGURED_MESSAGE =
  'Proveedor de datos externos no configurado. Define FOOTBALL_DATA_API_KEY.';

/**
 * Implementacion nula (Null Object pattern) usada cuando no hay ningun
 * proveedor externo configurado. Permite que el resto de la
 * infraestructura de sincronizacion exista y se pueda testear sin
 * depender de una clave de API real.
 */
@Injectable()
export class NullSportsDataProvider implements SportsDataProvider {
  getProviderName(): string {
    return 'none';
  }

  isConfigured(): boolean {
    return false;
  }

  getCompetitions(): Promise<ExternalCompetition[]> {
    return Promise.reject(
      new ServiceUnavailableException(NOT_CONFIGURED_MESSAGE),
    );
  }

  getTeams(): Promise<ExternalTeam[]> {
    return Promise.reject(
      new ServiceUnavailableException(NOT_CONFIGURED_MESSAGE),
    );
  }

  getMatches(): Promise<ExternalMatch[]> {
    return Promise.reject(
      new ServiceUnavailableException(NOT_CONFIGURED_MESSAGE),
    );
  }
}
