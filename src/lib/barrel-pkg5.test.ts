import * as barrel from '../index';

// PKG5-DS (0.39.0): new public exports reach consumers through the package barrel.
describe('library barrel exports added in 0.39.0', () => {
  it('exports ACTION_TOAST_DURATION (R-LIB-01)', () => {
    expect(barrel.ACTION_TOAST_DURATION).toBe(10000);
  });
});

describe('library barrel exports added in 0.39.0 (forms)', () => {
  it('exports Field and FormErrorSummary (R-LIB-06, R-LIB-07)', () => {
    expect(typeof barrel.Field).toBe('function');
    expect(typeof barrel.FormErrorSummary).toBe('function');
  });
});
