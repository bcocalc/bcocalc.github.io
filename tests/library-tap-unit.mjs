import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

for (const file of ['measurement.js', 'dev/measurement.js']) {
  const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
  const fn = source.slice(source.indexOf('function bindLibraryTap('), source.indexOf('window.tapCalcBindLibraryTap ='));
  for (const scenario of ['tap', 'swipe', 'end-moved', 'cancel', 'long-press', 'page-scroll', 'list-scroll', 'multitouch', 'disabled', 'keyboard', 'mouse', 'programmatic']) {
    const listeners = {};
    let calls = 0;
    let now = 0;
    const target = { isConnected: true, disabled: scenario === 'disabled', closest: () => target };
    const element = { scrollLeft: 0, scrollTop: 0, contains: node => node === target,
      addEventListener: (type, fn) => { listeners[type] = fn; } };
    const window = { scrollX: 0, scrollY: 0 };
    const context = vm.createContext({ window, Date: { now: () => now }, element, handler: () => { calls++; } });
    vm.runInContext(fn + "\nbindLibraryTap(element, handler, '[data-recent-history-id]');", context);
    const touch = { identifier: 1, clientX: 10, clientY: 20 };
    const event = { target, touches: [touch], changedTouches: [touch], cancelable: true, prevented: false,
      preventDefault() { this.prevented = true; } };
    if (['keyboard', 'mouse', 'programmatic'].includes(scenario)) {
      listeners.click({ ...event, isTrusted: scenario !== 'programmatic', detail: scenario === 'keyboard' ? 0 : 1, pointerType: 'mouse' });
      assert.equal(calls, 1);
      continue;
    }
    listeners.touchstart(event);
    now = 100;
    if (scenario === 'swipe') listeners.touchmove({ ...event, touches: [{ ...touch, clientX: 60 }] });
    if (scenario === 'end-moved') event.changedTouches = [{ ...touch, clientY: 60 }];
    if (scenario === 'cancel') listeners.touchcancel(event);
    if (scenario === 'long-press') now = 900;
    if (scenario === 'page-scroll') window.scrollY = 100;
    if (scenario === 'list-scroll') element.scrollLeft = 30;
    if (scenario === 'multitouch') listeners.touchmove({ ...event, touches: [touch, { ...touch, identifier: 2 }] });
    event.touches = [];
    listeners.touchend(event);
    assert.equal(calls, scenario === 'tap' ? 1 : 0, scenario);
    assert.equal(event.prevented, scenario === 'tap', 'Swipes must retain browser scrolling');
    if (scenario === 'tap') {
      listeners.click({ ...event, isTrusted: true, detail: 1, pointerType: 'touch' });
      assert.equal(calls, 1, 'No duplicate compatibility click');
      listeners.click({ ...event, isTrusted: true, detail: 0 });
      assert.equal(calls, 2, 'Keyboard remains usable after a touch');
    }
  }
  console.log('PASS ' + file + ': 12 touch, swipe, disabled, duplicate-click, mouse and keyboard cases');
}
