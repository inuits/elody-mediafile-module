import { AuthRESTDataSource } from 'base-graphql';

export class StorageAPI extends AuthRESTDataSource {
  public baseURL = `${this.environment.api.storageApiUrl}`;
}
