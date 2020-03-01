import { metadata, RelationDescriptor } from './metadata';
import { action, observable, computed } from 'mobx';
import AppError from './app-error';

let defaultIdCount = 0;

function generateDefaultId() {
  return ++defaultIdCount;
}

class BaseModel {
  _id = null;
  _type = 'model';
  _latestJson = null;

  /** @type Store */
  _ds;

  /** @type BaseService */
  _service;

  /** @type AppError[] */
  @observable _errors = observable.array([]);

  schema = null;
  casts = {};

  constructor(_ds, _service) {
    this._ds = _ds;
    this._service = _service;
    this.id = `unsaved-model-${generateDefaultId()}`;
  }

  get id() {
    return this._id;
  }

  set id(value) {
    this._id = value;
  }

  get isUnsaved() {
    return this.id.toString().startsWith('unsaved-model-');
  }

  @action setErrors(errors = []) {
    this._errors.replace(errors);
  }

  @computed get isValid() {
    return this._errors.length === 0;
  }

  get _modelName() {
    return this.constructor._name;
  }

  getAttribute(attrName) {
    return this[attrName];
  }

  @action setAttribute(attrName, value) {
    return (this[attrName] = value);
  }

  @action setAttributes(values) {
    Object.keys(values).forEach(key => {
      this.setAttribute(key, values[key]);
    });
  }

  getSnapshot() {
    const attrs = metadata.getModel(this._modelName).getAttributes();
    const snapshot = {};

    attrs.forEach(attr => {
      snapshot[attr.name] = this[attr.name];
    });

    return snapshot;
  }

  validate() {
    this._errors.replace(this.validateSnapshot(this.getSnapshot()));
  }

  validateAttribute(attr) {
    this.clearErrors(attr);
    const errors = this.validateAttributeFromSnapshot(attr, this.getSnapshot());
    this._errors.replace([...this._errors, ...errors]);
  }

  firstError(attr = null) {
    if (attr) {
      return this._errors.find(e => e.attribute === attr);
    }

    return this._errors[0];
  }

  firstErrorMessage(attr = null) {
    const error = this.firstError(attr);
    if (error) {
      return error.message;
    }

    return null;
  }

  hasError(attr = null) {
    return Boolean(this.firstError(attr));
  }

  clearErrors(attr = null) {
    if (attr) {
      this._errors.replace(this._errors.filter(e => e.attribute !== attr));
    } else {
      this._errors.clear();
    }
  }

  validateSnapshot(snapshot) {
    try {
      this.schema.validateSync(snapshot, { abortEarly: false });
      return [];
    } catch (errors) {
      return this._processYupErrors(errors);
    }
  }

  validateAttributeFromSnapshot(attr, snapshot) {
    try {
      this.schema.validateSyncAt(attr, snapshot, { abortEarly: false });
      return [];
    } catch (errors) {
      return this._processYupErrors(errors);
    }
  }

  fieldProps(attr, overrides = {}) {
    const props = {
      value: this[attr],
      onChange: action(e => (this[attr] = e.target.value)),
      onBlur: () => this.validateAttribute(attr),
      isInvalid: this.hasError(attr),
      validationMessage: this.firstErrorMessage(attr),
      ...overrides
    };
    Object.keys(props).forEach(k => {
      // eslint-disable-next-line no-undefined
      if (props[k] === null || props[k] === undefined) {
        delete props[k];
      }
    });
    return props;
  }

  _processYupErrors(errors) {
    return errors.inner.map(e => new AppError(e.message, e.path));
  }

  toJson(excludeFalsyValues = false) {
    // todo(ion) this should support casts
    const attrs = metadata.getModel(this._modelName).getAttributes();
    const json = {
      id: this.id
    };

    attrs.forEach(attr => {
      const value = this.getAttribute(attr.name);

      if (attr.relation) {
        if (attr.relation.type === RelationDescriptor.belongsTo) {
          if (value) {
            json[attr.relation.propName] = value.id;
            return;
          }
        }
      }

      if (excludeFalsyValues && !value) {
        return;
      }

      json[attr.name] = this[attr.name];
    });

    return json;
  }

  fromJson(json, excludeFalsyValues = false) {
    // todo(ion) this should support transformers
    const attrs = metadata.getModel(this._modelName).getAttributes();

    this.id = json.id;

    attrs.forEach(attr => {
      const value = json[attr.name];
      if (excludeFalsyValues && !value) {
        return;
      }

      if (attr.relation) {
        const serviceName = metadata.getServiceForModel(attr.relation.modelName);
        if (attr.relation.type === RelationDescriptor.hasOne) {
          if (value) {
            this[attr.name] = this._ds[serviceName].createRecord(value);
          }

          this[attr.name] = null;
        }

        if (attr.relation.type === RelationDescriptor.hasMany) {
          this[attr.name] = (value || []).map(j => this._ds[serviceName].createRecord(j));
        }

        if (attr.relation.type === RelationDescriptor.belongsTo) {
          if (value) {
            this[attr.name] = this._ds[serviceName]._createOrUpdateModel(value);
          } else {
            this[attr.name] = null;
          }
        }
      } else {
        this[attr.name] = value;
      }
    });

    this._latestJson = json;
    return this;
  }

  resetToLatestJson() {
    this.fromJson(this._latestJson);
  }
}

export function Model(modelName) {
  metadata.addModel(modelName);

  return class extends BaseModel {
    static _name = modelName;
  };
}
