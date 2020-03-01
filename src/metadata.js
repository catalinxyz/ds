class AttributeDescriptor {
  name;
  /** @type RelationDescriptor | null */
  relation;

  constructor(name, relation) {
    this.name = name;
    this.relation = relation;
  }
}

export class RelationDescriptor {
  type;
  modelName;
  propName;

  static hasOne = 'hasOne';
  static hasMany = 'hasMany';
  static belongsTo = 'belongsTo';

  constructor(type, modelName, propName) {
    this.type = type;
    this.modelName = modelName;
    this.propName = propName;
  }
}

class ModelDescriptor {
  name = null;

  /** @type Map<string, AttributeDescriptor> */
  attributes = new Map();

  constructor() {
    this.name = name;
  }

  addAttribute(name, relation = null) {
    this.attributes.set(name, new AttributeDescriptor(name, relation));
  }

  getAttributes() {
    return [...this.attributes.values()];
  }
}

class Metadata {
  _models = new Map();
  _services = new Map();
  _modelServiceMap = new Map();

  /**
   * @param service {BaseService}
   * @param dsName {String}
   */
  addService(service, dsName) {
    this._services.set(dsName, service);
    if (service._modelClass) {
      this._modelServiceMap.set(service._modelClass._name, dsName);
    }
  }

  addModel(modelName) {
    this._models.set(modelName, new ModelDescriptor(modelName));
  }

  getModel(modelName) {
    return this._models.get(modelName);
  }

  getServiceForModel(modelName) {
    return this._modelServiceMap.get(modelName);
  }
}

export const metadata = new Metadata();
