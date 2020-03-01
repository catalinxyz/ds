import React, { Component, Children, cloneElement } from 'react';
import PT from 'prop-types';
import { Observer } from 'mobx-react-lite';
import kStatus from './states';

/* eslint-disable func-style */
const Resolved = ({ children, value = null }) => children(value);
const Rejected = ({ children, value = null }) => children(value);
const Loading = ({ children, value = null }) => children(value);
const Pending = ({ children, value = null }) => children(value);
/* eslint-enable */

const kInstance = {
  resolved: <Resolved />,
  rejected: <Rejected />,
  loading: <Loading />,
  pending: <Pending />
};

const kDefaultChildrenMap = {
  [kStatus.resolved]: <></>,
  [kStatus.rejected]: <></>,
  [kStatus.loading]: <></>,
  [kStatus.pending]: <></>
};

/**
 * @param {Object} children defaults
 * @return {void}
 */
function configure(children = {}) {
  Object.assign(kDefaultChildrenMap, children);
}

class Task extends Component {
  static Resolved = Resolved;

  static Rejected = Rejected;

  static Loading = Loading;

  static Pending = Pending;

  static propTypes = {
    task: PT.oneOfType([PT.func, PT.object]).isRequired,
    delay: PT.number,
    children: PT.any.isRequired, // eslint-disable-line
    shouldAlwaysRenderResolved: PT.bool
  };

  static defaultProps = {
    delay: 0,
    shouldAlwaysRenderResolved: false
  };

  state = {
    isWaiting: false
  };

  componentDidMount() {
    if (this.canSetupWaiting()) {
      this.setupWaiting();
    }
  }

  componentWillUnmount() {
    clearInterval(this.waitingInterval);
    this.waitingInterval = null;
  }

  waitingInterval = null;

  setupWaiting() {
    const { delay } = this.props;
    this.waitingInterval = setTimeout(() => {
      this.setState({ isWaiting: false });
    }, delay);
  }

  canSetupWaiting() {
    const { task } = this.props;
    const { isWaiting } = this.state;

    return task.state.loading && isWaiting && !this.waitingInterval;
  }

  resetWaiting() {
    clearInterval(this.waitingInterval);
    this.waitingInterval = null;
    this.setState({ isWaiting: true });
  }

  componentWillReact() {
    const { task } = this.props;

    if (this.canSetupWaiting()) {
      this.setupWaiting();
    }

    if ((task.state.rejected || task.state.resolved) && Boolean(this.waitingInterval)) {
      this.resetWaiting();
    }
  }

  getChildrenMap() {
    const { children } = this.props;

    return Children.toArray(children).reduce(
      (result, c) => {
        // eslint-disable-next-line default-case
        switch (c.type) {
          case kInstance.resolved.type:
            result[kStatus.resolved] = c;
            break;
          case kInstance.rejected.type:
            result[kStatus.rejected] = c;
            break;
          case kInstance.loading.type:
            result[kStatus.loading] = c;
            break;
          case kInstance.pending.type:
            result[kStatus.pending] = c;
            break;
        }

        return result;
      },
      { ...kDefaultChildrenMap }
    );
  }

  render() {
    return (
      <Observer>
        {() => {
          const { task, shouldAlwaysRenderResolved } = this.props;
          const { isWaiting } = this.state;
          const children = this.getChildrenMap();

          if (task.state.isLoading && isWaiting) {
            return null;
          }

          let value = task.state.result;

          if (task.state.isRejected) {
            value = task.state.error;
          }
          if (shouldAlwaysRenderResolved && task.state.status !== kStatus.resolved) {
            return [
              cloneElement(children[kStatus.resolved], { value }),
              children[task.state.status]
            ];
          }

          return cloneElement(children[task.state.status], { value });
        }}
      </Observer>
    );
  }
}

export { Task as default, configure };
