import STATES from './states';

/**
 * Creates a handler function for task state
 *
 * @param {Function} task A method decorated in a task
 * @returns {Function} Handler function for task
 */
function createHandler(task) {
  /**
   * Handler function for task state
   *
   * @param {Object} Handlers Object containing handler for task state
   * @param {Function} Handler.loading Called when a task starts
   * @param {Function} Handler.pending Called when a task is created (initial status)
   * @param {Function} Handler.resolved Called with result when a task resolves
   * @param {Function} Handler.rejected Called with error when a task rejects
   *
   * @return {*} null if no handler is matched otherwise a handler
   *
   * @example
   *  task.handle({
   *    pending: () => <div>pending</div>,
   *    loading: () => <div>Loading</div>,
   *    resolved: result => <div>{result}</div>,
   *    rejected: error => <div>{error}</div>,
   *  })
   */
  return function handle({
    loading = () => null,
    pending = () => null,
    resolved = () => null,
    rejected = () => null
  }) {
    const { state } = task;

    switch (state.status) {
      case STATES.loading:
        return loading();
      case STATES.pending:
        return pending();
      case STATES.resolved:
        return resolved(state.result);
      case STATES.rejected:
        return rejected(state.error);
      default:
        return null;
    }
  };
}

export { createHandler };
