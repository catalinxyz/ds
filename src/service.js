import { metadata } from './metadata';
import { request } from './request';

export function service(serviceClass) {
  /* eslint-disable-next-line */
  return (target, propertyKey, descriptor) => {
    metadata.addService(serviceClass, propertyKey);
  };
}

class CacheModelEntry {
  model = null;
  updatedAt = null;

  constructor(model) {
    this.model = model;
    this.updatedAt = new Date();
  }
}

export class BaseService {
  static _name = null;
  static _model = null;
  baseUrl = null;

  /** @type Store */
  _ds = null;

  _type = 'service';

  get _modelClass() {
    return this.constructor._model;
  }

  /** @type Map<string, CacheModelEntry> */
  _cache = new Map();

  constructor(ds) {
    this._ds = ds;

    this.init();
  }

  // eslint-disable-next-line no-empty-function
  init() {}

  createRecord(json = {}) {
    const record = new this._modelClass(this._ds, this);

    return record.fromJson(json);
  }

  _createRecordsFromResponse(data) {
    if (Array.isArray(data)) {
      return data.map(d => this._createOrUpdateModel(d));
    }

    return this._createOrUpdateModel(data);
  }

  _createOrUpdateModel(json) {
    if (this._cache.has(json.id)) {
      return this._cache.get(json.id).model.fromJson(json);
    }

    const record = new this._modelClass(this._ds, this).fromJson(json);
    this._cache.set(record.id, new CacheModelEntry(record));
    return record;
  }

  @request findMany(opts = {}) {
    let url = `${this.baseUrl}/findMany`;
    if (opts.context) {
      url = `${opts.context.$service.baseUrl}/${opts.context.id}/relationships/${url}`;
    }

    if (opts.date) {
      url = `${url}?date=${opts.date}`;
    }

    return this._ds
      .backend(`/api/${url}`)
      .then(r => this._createRecordsFromResponse(r.data.data));
  }

  @request findOne(id) {
    /* eslint-disable-next-line */
    id = Number.parseInt(id, 10);
    if (this._cache.has(id)) {
      return Promise.resolve(this._cache.get(id).model);
    }

    return this._ds
      .backend(`/api/${this.baseUrl}/${id}/findOne`)
      .then(r => this._createRecordsFromResponse(r.data.data));
  }

  @request create(record, opts = {}) {
    let url = `${this.baseUrl}/create`;
    if (opts.context) {
      url = `${opts.context.$service.baseUrl}/${opts.context.id}/relationships/${url}`;
    }

    return this._ds.backend(`/api/${url}`, record.toJson()).then(r => {
      return record.fromJson(r.data.data);
    });
  }

  @request update(record, opts = {}) {
    let url = `${this.baseUrl}/${record.id}/update`;
    if (opts.context) {
      url = `${opts.context.$service.baseUrl}/${opts.context.id}/relationships/${url}`;
    }

    return this._ds.backend(`/api/${url}`, record.toJson()).then(r => {
      return record.fromJson(r.data.data);
    });
  }

  @request destroy(record, opts = {}) {
    let url = `${this.baseUrl}/${record.id}/destroy`;
    if (opts.context) {
      url = `${opts.context.$service.baseUrl}/${opts.context.id}/relationships/${url}`;
    }

    return this._ds.backend(`/api/${url}`, record.toJson());
  }

  @request attach(record, opts = {}) {
    let url = `${this.baseUrl}/${record.id}/attach`;
    if (opts.context) {
      url = `${opts.context.$service.baseUrl}/${opts.context.id}/relationships/${url}`;
    }

    return this._ds.backend(`/api/${url}`);
  }

  @request detach(record, opts = {}) {
    let url = `${this.baseUrl}/${record.id}/detach`;
    if (opts.context) {
      url = `${opts.context.$service.baseUrl}/${opts.context.id}/relationships/${url}`;
    }

    return this._ds.backend(`/api/${url}`);
  }

  @request findRelation(record, relationName) {
    return this._ds
      .backend(`/api/${this.baseUrl}/${record.id}/${relationName}`)
      .then(r => {
        record.fromJson({
          [relationName]: r.data
        });

        return record;
      });
  }
}

export function Service(name, model, baseUrl) {
  return class extends BaseService {
    static _name = name;
    static _model = model;
    baseUrl = baseUrl;
  };
}
