export const isEmptyCondition = (condition: unknown): boolean => {
  if (!condition) {
    return true;
  }

  if (Array.isArray(condition)) {
    return !condition.length || condition.some(isEmptyCondition);
  }

  return typeof condition === 'object' && Object.values(condition).every(value => value === undefined);
};
