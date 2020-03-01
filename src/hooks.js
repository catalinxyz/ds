import { useEffect, useState, useRef } from 'react';

/**
 * @param fn
 * @param args
 * @param autoExecute
 * @return {RequestState}
 */
export function useRequest(fn, args = [], autoExecute = true) {
  const [current, setCurrent] = useState(() => {
    const r = fn(...args);
    if (autoExecute) {
      r.execute();
    }
    return r;
  });
  const isInitialValue = useRef(true);

  useEffect(() => {
    if (isInitialValue.current) {
      isInitialValue.current = false;
    } else {
      setCurrent(fn(...args));
    }
  }, []);

  return current;
}

/**
 * @param service
 * @param args
 * @return {BaseModel}
 */
export function useCreateRecord(service, ...args) {
  const [current, setCurrent] = useState(() => service.createRecord(...args));
  const isInitialValue = useRef(true);

  useEffect(() => {
    if (isInitialValue.current) {
      isInitialValue.current = false;
    } else {
      setCurrent(service.createRecord(...args));
    }
  }, [service, ...args]);

  return current;
}
