import { action } from 'mobx';
import kStatus, { stateCreator } from './states';
import TaskState from './task-state';
import { createHandler } from './helpers';

/**
 * Creates a new task which wrapps the method
 *
 * @param {Function} fn - method beeing decorated
 * @param {Object} target this
 * @returns {Function} Task
 */
function createTask(fn, target) {
  /**
   * Used to update state only once in case
   * of multiple concurrent calls to the task
   */
  const callCount = 0;

  /**
   * Task function wrapper
   * we need to wrap this in an mobx action
   * so it updates the state in that class
   */
  const actionTask = action((...args) => {
    const callCountAtStart = callCount;

    actionTask.setState(stateCreator(kStatus.loading));
    const promise = fn
      .call(target, ...args)
      .then(result => {
        if (callCountAtStart === callCount) {
          actionTask.setState(stateCreator(kStatus.resolved, result));
        }

        return result;
      })
      .catch(error => {
        /* istanbul ignore else  */
        if (callCountAtStart === callCount) {
          actionTask.setState(stateCreator(kStatus.rejected, error));
        }

        /**
         * In development throw the error so we see in the console
         * it helps in cases of syntax error that are caught here
         */
        // if (__DEV__) {
        //   throw error
        // }

        return error;
      });

    actionTask.state.setPromise(promise);
    return actionTask.state;
  });

  /**
   * Enhance the method with props to be Used
   * in components for task state handling
   */
  // todo(ion): might not need this anymore
  Object.assign(actionTask, {
    state: new TaskState(),
    handle: createHandler(actionTask),
    setState: action(state => Object.assign(actionTask.state, state))
  });

  return actionTask;
}

/**
 * Decorator meant to wrap a state method for easier
 * handling of async call
 *
 * This decorator wrap the method and enhances it with a state.
 * The method must return a promise so we can set the stated based
 * on that promise.
 *
 * It adds the following props to the method:
 *
 * state - The current state of the execution
 *  status - One of loading, pending, resolved or rejected
 *  error - Set to the error if rejected
 *  result - Set to the result if resolved
 *
 * pending - the initial status of the state
 * loading - true when task is executing
 * resolved - true when task executed succesfully
 * rejected - true when task executed with error
 *
 * handle() - easy handling of state status see ./helpers (createHandler)
 *
 * @example
 *  // state class
 *  class MyState {
 *    @task search(query = '') {
 *      return http.get('something')
 *    }
 *  }
 *
 *  // Component
 *  render() {
 *    return (
 *      this.MyState.search.handle({
 *        loading: () => <Loader />,
 *        resolved: result => <div>{result}</div>,
 *        rejected: error => <div>{error}</div>
 *      })
 *    )
 *  }
 *
 * @param {Object} target Class containing the method being decorated
 * @param {string} name Name of the method beeing decorated
 * @param {Object} descriptor Descriptor object of the method
 *
 * @return {Object} Descriptor with value wrapped in a task
 */
function task(target, name, descriptor) {
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
        value: createTask(descriptor.value, this)
      });

      return this[name];
    }
  };
}

export { task as default, createTask };
