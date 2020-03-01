import { metadata } from './metadata';

export class Store {
  metadata = metadata;

  /** @type AxiosInstance */
  http;

  constructor(http) {
    this.http = http;
  }

  /*
   * used to make requests to out backend
   * always uses post
   */
  backend(...args) {
    return this.http.post(...args);
  }

  init() {
    this._initServices();
  }

  _initServices() {
    metadata._services.forEach((service, name) => {
      this[name] = new service(this);
    });
  }
}
