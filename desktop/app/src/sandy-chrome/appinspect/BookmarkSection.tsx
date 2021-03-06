/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React, {useCallback, useMemo} from 'react';
import {AutoComplete, Input, Typography} from 'antd';
import {StarFilled, StarOutlined} from '@ant-design/icons';
import {useStore} from '../../utils/useStore';
import {Layout, NUX, useValue} from 'flipper-plugin';
import {navPluginStateSelector} from '../../chrome/LocationsButton';

// eslint-disable-next-line flipper/no-relative-imports-across-packages
import type {NavigationPlugin} from '../../../../plugins/navigation/index';
import {useMemoize} from '../../utils/useMemoize';
import styled from '@emotion/styled';

const {Text} = Typography;

export function BookmarkSection() {
  const navPlugin = useStore(navPluginStateSelector);

  return navPlugin ? (
    <NUX
      title="Use bookmarks to directly navigate to a location in the app."
      placement="right">
      <BookmarkSectionInput navPlugin={navPlugin} />
    </NUX>
  ) : null;
}

function BookmarkSectionInput({navPlugin}: {navPlugin: NavigationPlugin}) {
  const currentURI = useValue(navPlugin.currentURI);
  const bookmarks = useValue(navPlugin.bookmarks);
  const patterns = useValue(navPlugin.appMatchPatterns);

  const isBookmarked = useMemo(() => bookmarks.has(currentURI), [
    bookmarks,
    currentURI,
  ]);

  const autoCompleteItems = useMemoize(
    navPlugin.getAutoCompleteAppMatchPatterns,
    [currentURI, bookmarks, patterns, 20],
  );

  const handleBookmarkClick = useCallback(() => {
    if (isBookmarked) {
      navPlugin.removeBookmark(currentURI);
    } else if (currentURI) {
      navPlugin.addBookmark({
        uri: currentURI,
        commonName: null,
      });
    }
  }, [navPlugin, currentURI, isBookmarked]);

  const bookmarkButton = isBookmarked ? (
    <StarFilled onClick={handleBookmarkClick} />
  ) : (
    <StarOutlined onClick={handleBookmarkClick} />
  );

  return (
    <StyledAutoComplete
      dropdownMatchSelectWidth={500}
      value={currentURI}
      onSelect={navPlugin.navigateTo}
      style={{flex: 1}}
      options={[
        {
          label: <Text strong>Bookmarks</Text>,
          options: Array.from(bookmarks.values()).map((bookmark) => ({
            value: bookmark.uri,
            label: (
              <NavigationEntry label={bookmark.commonName} uri={bookmark.uri} />
            ),
          })),
        },
        {
          label: <Text strong>Entry points</Text>,
          options: autoCompleteItems.map((value) => ({
            value: value.pattern,
            label: (
              <NavigationEntry label={value.className} uri={value.pattern} />
            ),
          })),
        },
      ]}>
      <Input
        addonAfter={bookmarkButton}
        defaultValue="<select a bookmark>"
        value={currentURI}
        onChange={(e) => {
          navPlugin.currentURI.set(e.target.value);
        }}
        onPressEnter={() => {
          navPlugin.navigateTo(currentURI);
        }}
      />
    </StyledAutoComplete>
  );
}

function NavigationEntry({label, uri}: {label: string | null; uri: string}) {
  return (
    <Layout.Container>
      <Text>{label ?? uri}</Text>
      <Text type="secondary">{uri}</Text>
    </Layout.Container>
  );
}

const StyledAutoComplete = styled(AutoComplete)({
  display: 'flex',
  flex: 1,
  '.ant-select-selector': {
    flex: 1,
  },
});
