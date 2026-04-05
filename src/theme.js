/**
 * Webs — Ant Design 6 theme config
 * All values mirror the CSS custom properties in tokens.css so
 * both antd components and our hand-rolled CSS stay in sync.
 */
export const theme = {
  token: {
    // ── Brand ──────────────────────────────────────────────────────────
    colorPrimary:          '#1D6FD8',
    colorPrimaryBg:        'rgba(29, 111, 216, 0.08)',
    colorPrimaryBorder:    'rgba(29, 111, 216, 0.28)',
    colorPrimaryHover:     '#1560bf',
    colorPrimaryActive:    '#1252a8',

    // ── Backgrounds ────────────────────────────────────────────────────
    colorBgBase:           '#FFFFFF',
    colorBgContainer:      '#FFFFFF',
    colorBgLayout:         '#EDECEA',
    colorBgElevated:       '#FFFFFF',
    colorBgSpotlight:      '#1A1A1A',     // tooltip bg
    colorFillQuaternary:   '#ECEAE7',     // subtle hover fills

    // ── Text ───────────────────────────────────────────────────────────
    colorText:             '#1A1A1A',
    colorTextSecondary:    '#5A5A5A',
    colorTextTertiary:     '#8A8A8A',
    colorTextQuaternary:   '#8A8A8A',
    colorTextDisabled:     '#AAAAAA',

    // ── Borders ────────────────────────────────────────────────────────
    colorBorder:           'rgba(0, 0, 0, 0.12)',
    colorBorderSecondary:  'rgba(0, 0, 0, 0.07)',
    colorSplit:            'rgba(0, 0, 0, 0.07)',

    // ── Semantic ───────────────────────────────────────────────────────
    colorError:            '#C0392B',
    colorSuccess:          '#16A34A',
    colorWarning:          '#B45309',
    colorInfo:             '#1D6FD8',

    // ── Link ───────────────────────────────────────────────────────────
    colorLink:             '#1D6FD8',
    colorLinkHover:        '#1560bf',
    colorLinkActive:       '#1252a8',

    // ── Shape ──────────────────────────────────────────────────────────
    borderRadius:          6,
    borderRadiusSM:        3,
    borderRadiusLG:        10,
    borderRadiusXS:        2,

    // ── Typography ─────────────────────────────────────────────────────
    fontFamily:    "'Aeonik', 'Helvetica Neue', Arial, sans-serif",
    fontSize:      13,
    fontSizeSM:    11,
    fontSizeLG:    15,
    fontSizeXL:    18,
    lineHeight:    1.55,
    lineHeightSM:  1.25,

    // ── Spacing ────────────────────────────────────────────────────────
    sizeUnit:      4,
    sizeStep:      4,
    padding:       16,
    paddingSM:     12,
    paddingXS:     8,
    paddingXXS:    4,
    margin:        16,
    marginSM:      12,
    marginXS:      8,
    marginXXS:     4,

    // ── Motion ─────────────────────────────────────────────────────────
    motionDurationFast:  '100ms',
    motionDurationMid:   '160ms',
    motionDurationSlow:  '300ms',
    motionEaseOutCirc:   'cubic-bezier(0.16, 1, 0.3, 1)',

    // ── Shadow ─────────────────────────────────────────────────────────
    boxShadow:          '0 1px 3px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.07)',
    boxShadowSecondary: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.07)',
    boxShadowTertiary:  '0 8px 32px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.09)',

    // ── Z-index ────────────────────────────────────────────────────────
    zIndexPopupBase: 200,
  },

  components: {
    Button: {
      defaultBg:              'transparent',
      defaultBorderColor:     'rgba(0,0,0,0.14)',
      defaultColor:           '#5A5A5A',
      defaultHoverBg:         '#F3F2F0',
      defaultHoverBorderColor:'rgba(0,0,0,0.18)',
      defaultHoverColor:      '#1A1A1A',
      defaultActiveBg:        '#ECEAE7',
      contentFontSizeSM:      11,
      paddingInlineSM:        10,
      onlyIconSizeSM:         12,
    },

    Input: {
      colorBgContainer:       '#F3F2F0',
      colorBorder:            'rgba(0,0,0,0.12)',
      hoverBorderColor:       'rgba(0,0,0,0.22)',
      activeBorderColor:      '#1D6FD8',
      activeShadow:           '0 0 0 3px rgba(29,111,216,0.08)',
      colorTextPlaceholder:   '#8A8A8A',
      paddingBlock:           6,
      paddingInline:          10,
    },

    Modal: {
      titleFontSize:          15,
      titleColor:             '#1A1A1A',
      headerBg:               '#FFFFFF',
      contentBg:              '#FFFFFF',
      footerBg:               '#FFFFFF',
      paddingMD:              24,
      borderRadiusOuter:      10,
    },

    Segmented: {
      itemColor:              '#5A5A5A',
      itemHoverColor:         '#1A1A1A',
      itemHoverBg:            '#ECEAE7',
      itemSelectedBg:         'rgba(29, 111, 216, 0.10)',
      itemSelectedColor:      '#1D6FD8',
      trackBg:                '#F0EFED',
      trackPadding:           2,
    },

    Typography: {
      colorLink:              '#1D6FD8',
      colorLinkHover:         '#1560bf',
    },

    Tooltip: {
      colorBgSpotlight:       '#1A1A1A',
      colorTextLightSolid:    '#FFFFFF',
      borderRadius:           6,
      paddingSM:              8,
    },

    Divider: {
      colorSplit:             'rgba(0,0,0,0.08)',
      marginLG:               16,
    },
  },
};
