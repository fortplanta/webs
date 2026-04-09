/**
 * Webs — Ant Design 6 theme config (dark)
 */
import { theme as antTheme } from 'antd';

export const theme = {
  algorithm: antTheme.darkAlgorithm,
  token: {
    colorBgBase:           '#161614',
    colorBgContainer:      '#242424',
    colorBgElevated:       '#2A2927',
    colorBgLayout:         '#161614',
    colorBgSpotlight:      '#2A2927',
    colorFillQuaternary:   'rgba(255,255,255,0.05)',

    colorText:             '#F0EFE8',
    colorTextSecondary:    'rgba(240,239,232,0.58)',
    colorTextTertiary:     'rgba(240,239,232,0.35)',
    colorTextQuaternary:   'rgba(240,239,232,0.25)',
    colorTextDisabled:     'rgba(240,239,232,0.20)',

    colorBorder:           'rgba(255,255,255,0.08)',
    colorBorderSecondary:  'rgba(255,255,255,0.05)',
    colorSplit:            'rgba(255,255,255,0.07)',

    colorPrimary:          '#FFAB2B',
    colorPrimaryBg:        'rgba(255,171,43,0.10)',
    colorPrimaryBorder:    'rgba(255,171,43,0.25)',
    colorPrimaryHover:     '#ffc055',
    colorPrimaryActive:    '#e09520',

    colorError:            '#E05252',
    colorSuccess:          '#4CAF7D',
    colorWarning:          '#E09B3D',
    colorInfo:             '#60A5FA',

    colorLink:             '#FFAB2B',
    colorLinkHover:        '#ffc055',

    borderRadius:          5,
    borderRadiusSM:        2,
    borderRadiusLG:        8,
    borderRadiusXS:        2,

    fontFamily:    "'Neue Haas Unica', 'Helvetica Neue', Arial, sans-serif",
    fontSize:      13,
    fontSizeSM:    11,
    fontSizeLG:    15,
    lineHeight:    1.50,
    lineHeightSM:  1.30,

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

    motionDurationFast:  '80ms',
    motionDurationMid:   '140ms',
    motionDurationSlow:  '280ms',
    motionEaseOutCirc:   'cubic-bezier(0.16, 1, 0.3, 1)',

    boxShadow:          '0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
    boxShadowSecondary: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)',
    boxShadowTertiary:  '0 16px 40px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.3)',

    zIndexPopupBase: 200,
  },

  components: {
    Button: {
      defaultBg:              'transparent',
      defaultBorderColor:     'rgba(255,255,255,0.10)',
      defaultColor:           'rgba(240,239,232,0.50)',
      defaultHoverBg:         'rgba(255,255,255,0.05)',
      defaultHoverBorderColor:'rgba(255,255,255,0.20)',
      defaultHoverColor:      '#F0EFE8',
      contentFontSizeSM:      11,
      paddingInlineSM:        10,
    },

    Input: {
      colorBgContainer:       '#242424',
      colorBorder:            'rgba(255,255,255,0.10)',
      hoverBorderColor:       'rgba(255,255,255,0.20)',
      activeBorderColor:      '#FFAB2B',
      activeShadow:           '0 0 0 2px rgba(255,171,43,0.15)',
      colorTextPlaceholder:   'rgba(240,239,232,0.20)',
      paddingBlock:           6,
      paddingInline:          10,
    },

    Modal: {
      titleFontSize:          15,
      titleColor:             '#F0EFE8',
      headerBg:               '#1e1d1b',
      contentBg:              '#1e1d1b',
      footerBg:               '#1e1d1b',
      paddingMD:              24,
      borderRadiusOuter:      8,
    },

    Tooltip: {
      colorBgSpotlight:       '#2A2927',
      colorTextLightSolid:    '#F0EFE8',
      borderRadius:           5,
      paddingSM:              8,
    },

    Divider: {
      colorSplit:             'rgba(255,255,255,0.07)',
      marginLG:               16,
    },
  },
};
