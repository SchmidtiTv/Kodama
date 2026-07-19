class BrowserWebviewWindow {
  constructor(label) {
    this.label = label;
  }

  static async getByLabel() {
    return null;
  }

  async close() {}

  async isMaximized() {
    return false;
  }

  async minimize() {}

  async onResized() {
    return () => {};
  }

  async setTitle() {}

  async startDragging() {}

  async toggleMaximize() {}
}

const currentWindow = new BrowserWebviewWindow("main");

function getCurrentWebviewWindow() {
  return currentWindow;
}

export { BrowserWebviewWindow as WebviewWindow, getCurrentWebviewWindow };
