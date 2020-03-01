export default class AppError extends Error {
  message = null;
  attribute = null;
  isValidationError = false;

  constructor(message, attribute) {
    super();

    this.message = message;
    this.attribute = attribute;
    this.isValidationError = Boolean(attribute);
  }
}

window.e = AppError;
