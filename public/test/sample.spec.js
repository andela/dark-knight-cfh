describe('Filters', () => {
  beforeEach(module('app'));

  describe('test', () => {
    it('test', () => {
      expect(true).toBe(true);
    });
  });
});

describe('GameController', () => {
  beforeEach(module('mean.system'));

  let $controller;

  beforeEach(inject((_game_) => {
    Users = _game_;
  }));

  // A simple test to verify the Users service exists
  it('should exist', () => {
    expect(Users).toBeDefined();
  });
});
