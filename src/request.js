import { action, observable, computed } from 'mobx';

/**
 * Possible statuses for a request state
 */
const kStatus = {
  pending: 'pending',
  loading: 'loading',
  resolved: 'resolved',
  rejected: 'rejected'
};

export class RequestState {
  fn;
  target;
  args = [];
  promise = null;

  @observable status = 'pending';
  @observable error;
  @observable result; // ??

  @computed get isPending() {
    return this.status === kStatus.pending;
  }

  @computed get isLoading() {
    return this.status === kStatus.loading;
  }

  @computed get isResolved() {
    return this.status === kStatus.resolved;
  }

  @computed get isRejected() {
    return this.status === kStatus.rejected;
  }

  @computed get isDone() {
    return this.status === kStatus.rejected || this.status === kStatus.resolved;
  }

  constructor(fn, target, args) {
    this.fn = fn;
    this.target = target;
    this.args = args;
  }

  @action setState(status, result, error) {
    if (status) {
      this.status = status;
    }
    if (result) {
      this.result = result;
    }
    if (error) {
      this.error = error;
    }
  }

  /**
   * @param opts
   * @return {Promise}
   */
  @action.bound execute(opts = {}, argsOverride) {
    this.setState(kStatus.loading);
    const args = argsOverride || this.args;
    this.promise = this.fn.call(this.target, ...args);

    this.promise
      .then(result => {
        if (opts && opts.onResolved) {
          opts.onResolved(result);
        }
        return result;
      })
      .then(
        action(result => {
          this.setState(kStatus.resolved, result);
          return result;
        })
      )
      .catch(
        action(error => {
          this.setState(kStatus.rejected, null, error);

          /**
           * In development throw the error so we see in the console
           * it helps in cases of syntax error that are caught here
           */
          // if (__DEV__) {
          //   throw error
          // }

          return error;
        })
      );

    return this.promise;
  }

  match(matcher = {}) {
    let m = null;
    if (this.isDone && matcher.done) {
      m = matcher.done;
    } else {
      m = matcher[this.status];
    }

    if (!m) {
      return null;
    }

    return m(this.result, this.error);
  }
}

function createRequestFn(fn, target) {
  return action((...args) => {
    return new RequestState(fn, target, args);
  });
}

function decorator(target, name, descriptor) {
  return {
    configurable: true,
    enumerable: false,
    get() {
      /**
       * by default the value of the prop will be nothing
       * when we first try to access this `get()` and will
       * overwrite the prop with the bound action
       * we need this to have access to `this`
       */
      Object.defineProperty(this, name, {
        enumerable: false,
        writable: true,
        configurable: true,
        value: createRequestFn(descriptor.value, this)
      });

      return this[name];
    }
  };
}

export function request() {
  return decorator;
}
