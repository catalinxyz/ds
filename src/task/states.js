/**
 * Possible statuses for a task state
 */
const kStatus = {
  pending: 'pending',
  loading: 'loading',
  resolved: 'resolved',
  rejected: 'rejected'
};

/**
 * Helper object of state creator for easier state change
 */
const predefinedStates = {
  [kStatus.loading]: () => ({
    status: kStatus.loading,
    error: null,
    result: null
  }),

  [kStatus.pending]: () => ({
    status: kStatus.pending,
    error: null,
    result: null
  }),

  [kStatus.resolved]: result => ({
    status: kStatus.resolved,
    error: null,
    result
  }),

  [kStatus.rejected]: error => ({
    status: kStatus.rejected,
    result: null,
    error
  })
};

/**
 * Create a new state object based on a status
 *
 * @param {Object<STATES>} status New state status
 * @param {*} data Data to be passed to the creator
 * @returns {Object} Task state
 */
function stateCreator(status, data = null) {
  return predefinedStates[status](data);
}

export { kStatus as default, predefinedStates, stateCreator };
