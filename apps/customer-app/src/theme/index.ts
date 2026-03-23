// ─── F&G Design System ────────────────────────────────────────────────────────
// Spec: primary=#163D26, accent=#F5A826, display=Syne 800, body=Nunito 600/700
export const theme = {
  colors: {
    // Brand core
    primary:   '#84c225',    // Big Basket Green — headers, primary actions
    accent:    '#F5A826',    // Amber — secondary highlights
    accent2:   '#FFF8E1',    // Light yellow bg
    accent3:   '#E45F10',    // Offer Red/Orange
    
    // Neutrals
    background: '#FFFFFF',
    surface:    '#F8F8F8',
    surfaceAlt: '#F0F7F2',   // Very light green tint
    border:     '#EBEBEB',

    // Text
    text: {
      primary:   '#222222',  // Professional dark gray
      secondary: '#666666',  // Muted gray
      inverse:   '#FFFFFF',
      accent:    '#84c225',  // Green inline text
    },

    // Semantic
    success: '#84C225',
    error:   '#E45F10',
    warning: '#F5A826',
    info:    '#2563EB',

    // Tab bar
    tabActive:   '#84c225',
    tabInactive: '#666666',

    // Cards
    cardShadowColor: '#000000',
  },

  spacing: {
    xs:  4,
    s:   8,
    m:   12,
    l:   16,
    xl:  20,
    xxl: 24,
    xxxl:32,
  },

  typography: {
    fontFamily: {
      display: 'Syne-ExtraBold',   // Titles, prices — fallback: System bold
      bold:    'Nunito-Bold',       // Subheadings
      semibold:'Nunito-SemiBold',   // Labels, descriptions
      medium:  'Nunito-Medium',     // Medium weight body
      regular: 'Nunito-Regular',    // Body
    },
    size: {
      xs:   11,
      s:    13,
      m:    15,
      l:    18,
      xl:   22,
      xxl:  28,
      xxxl: 36,
    },
  },

  borderRadius: {
    xs:   6,
    s:    10,
    m:    16,
    l:    20,   // Cards, modals
    xl:   28,   // Buttons
    full: 9999,
  },

  shadows: {
    card: {
      shadowColor: '#163D26',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
      elevation: 3,
    },
    orange: {
      shadowColor: '#F08020',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.32,
      shadowRadius: 28,
      elevation: 8,
    },
    bottom: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};
