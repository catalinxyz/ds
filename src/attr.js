import { observable } from 'mobx';
import { metadata, RelationDescriptor } from './metadata';

export function attr() {
  return (target, propertyKey, descriptor) => {
    const modelDescriptor = metadata.getModel(target.constructor._name);
    modelDescriptor.addAttribute(propertyKey);

    return observable(target, propertyKey, descriptor);
  };
}

export function hasOne(modelName) {
  return (target, propertyKey, descriptor) => {
    const modelDescriptor = metadata.getModel(target.constructor._name);
    modelDescriptor.addAttribute(
      propertyKey,
      new RelationDescriptor(RelationDescriptor.hasOne, modelName)
    );

    return observable(target, propertyKey, descriptor);
  };
}

export function hasMany(modelName) {
  return (target, propertyKey, descriptor) => {
    const modelDescriptor = metadata.getModel(target.constructor._name);
    modelDescriptor.addAttribute(
      propertyKey,
      new RelationDescriptor(RelationDescriptor.hasMany, modelName)
    );

    return observable(target, propertyKey, descriptor);
  };
}

export function belongsTo(modelName, propName) {
  return (target, propertyKey, descriptor) => {
    const modelDescriptor = metadata.getModel(target.constructor._name);
    modelDescriptor.addAttribute(
      propertyKey,
      new RelationDescriptor(RelationDescriptor.belongsTo, modelName, propName)
    );

    return observable(target, propertyKey, descriptor);
  };
}
