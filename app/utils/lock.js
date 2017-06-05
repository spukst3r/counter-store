class Lock {
  init() {
    this.promise = Promise.resolve();
    this.locked = false;
  }

  async wait() {
    await this.promise;
  }

  async acquire(fn) {
    this.locked = true;

    this.promise = new Promise(async (resolve, reject) => {
      try {
        await fn();
      } catch (e) {
        reject(e);
      }

      this.locked = false;
      resolve();
    });
  }

  isLocked() {
    return this.locked;
  }
}


module.exports = Lock;
