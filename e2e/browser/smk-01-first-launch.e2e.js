const assert = require("node:assert/strict");

const { requests, reset } = require("../fixtures/client.cjs");
const { clearWebviewStorage } = require("../support/desktop-state.cjs");
const { resetRuntimeControls } = require("../support/runtime-controls.cjs");

describe("SMK-01 first launch", () => {
  beforeEach(async () => {
    await reset("firstRun");
    await clearWebviewStorage();
    await resetRuntimeControls();
  });

  it("shows language onboarding without an unhandled sidecar request", async () => {
    const languagePicker = await $("[data-testid='language-picker']");
    await languagePicker.waitForDisplayed();

    assert.equal(await languagePicker.isDisplayed(), true);
    assert.equal(await $("[data-testid='login-screen']").isExisting(), false);

    const requestLog = await requests();
    assert.deepEqual(
      requestLog.filter((request) => request.responseStatus >= 400),
      [],
      "first launch must not call an unhandled fake-sidecar route"
    );
  });
});
