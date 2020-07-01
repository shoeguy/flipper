/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React, {useContext} from 'react';
import produce from 'immer';
import {FlipperPlugin} from '../plugin';
import {
  renderMockFlipperWithPlugin,
  createMockPluginDetails,
} from '../test-utils/createMockFlipperWithPlugin';
import {SandyPluginContext, SandyPluginDefinition} from 'flipper-plugin';

interface PersistedState {
  count: 1;
}

class TestPlugin extends FlipperPlugin<any, any, any> {
  static id = 'TestPlugin';

  static defaultPersistedState = {
    count: 0,
  };

  static persistedStateReducer(
    persistedState: PersistedState,
    method: string,
    payload: {delta?: number},
  ) {
    return produce(persistedState, (draft) => {
      if (method === 'inc') {
        draft.count += payload?.delta || 1;
      }
    });
  }

  render() {
    return (
      <h1>
        Hello:{' '}
        <span data-testid="counter">{this.props.persistedState.count}</span>
      </h1>
    );
  }
}

test('Plugin container can render plugin and receive updates', async () => {
  const {renderer, sendMessage, act} = await renderMockFlipperWithPlugin(
    TestPlugin,
  );
  expect(renderer.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <div
              class="css-1orvm1g-View-FlexBox-FlexColumn"
            >
              <h1>
                Hello:
                 
                <span
                  data-testid="counter"
                >
                  0
                </span>
              </h1>
            </div>
            <div
              class="css-bxcvv9-View-FlexBox-FlexRow"
              id="detailsSidebar"
            />
          </div>
        </body>
      `);

  act(() => {
    sendMessage('inc', {delta: 2});
  });

  expect((await renderer.findByTestId('counter')).textContent).toBe('2');
});

test('PluginContainer can render Sandy plugins', async () => {
  let renders = 0;

  function MySandyPlugin() {
    renders++;
    const sandyContext = useContext(SandyPluginContext);
    expect(sandyContext).not.toBe(null);
    return <div>Hello from Sandy</div>;
  }

  const plugin = () => ({});

  const definition = new SandyPluginDefinition(createMockPluginDetails(), {
    plugin,
    Component: MySandyPlugin,
  });
  // any cast because this plugin is not enriched with the meta data that the plugin loader
  // normally adds. Our further sandy plugin test infra won't need this, but
  // for this test we do need to act a s a loaded plugin, to make sure PluginContainer itself can handle it
  const {renderer, act, sendMessage} = await renderMockFlipperWithPlugin(
    definition,
  );
  expect(renderer.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <div
              class="css-1orvm1g-View-FlexBox-FlexColumn"
            >
              <div>
                Hello from Sandy
              </div>
            </div>
            <div
              class="css-bxcvv9-View-FlexBox-FlexRow"
              id="detailsSidebar"
            />
          </div>
        </body>
      `);
  expect(renders).toBe(1);

  // sending a new message doesn't cause a re-render
  act(() => {
    sendMessage('inc', {delta: 2});
  });

  // TODO: check that onConnect is called T68683507
  // TODO: check that messages have arrived T68683442

  expect(renders).toBe(1);
});