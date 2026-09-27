class Client {
  constructor(options) {
    this.options = options;
  }
  initialize() { return Promise.resolve(); }
  destroy() { return Promise.resolve(); }
  getState() { return Promise.resolve('CONNECTED'); }
  getChats() { return Promise.resolve([]); }
  on() { return this; }
}

class LocalAuth {
  constructor(options) {
    this.options = options;
  }
}

module.exports = {
  Client,
  LocalAuth,
};
