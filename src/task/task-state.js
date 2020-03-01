import { observable, computed, action } from 'mobx';
import kStatus from './states';

class TaskState {
  /** Current task status (see ./states) */
  @observable status = kStatus.pending;

  /** Set to the error when rejected */
  @observable error = null;

  /** Set to the result when resolved */
  @observable.ref result = null;

  /** set to the promise when action is invoked */
  @observable.ref promise = null;

  @computed
  get isLoading() {
    return this.status === kStatus.loading;
  }

  @computed
  get isPending() {
    return this.status === kStatus.pending;
  }

  @computed
  get isRejected() {
    return this.status === kStatus.rejected;
  }

  @computed
  get isResolved() {
    return this.status === kStatus.resolved;
  }

  @computed
  get isDone() {
    return this.status === kStatus.rejected || this.status === kStatus.resolved;
  }

  @action
  setInLoading() {
    this.status = kStatus.loading;
  }

  @action
  setInPending() {
    this.status = kStatus.pending;
  }

  @action
  setInResolved(result) {
    this.status = kStatus.resolved;
    this.result = result;
  }

  @action
  setInRejected(error) {
    this.status = kStatus.rejected;
    this.error = error;
  }

  @action setPromise(promise) {
    this.promise = promise;
  }

  @action reset() {
    this.status = kStatus.pending;
    this.error = null;
    this.result = null;
  }
}

export { TaskState as default };
