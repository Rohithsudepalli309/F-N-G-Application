// ─── F&G Design System ────────────────────────────────────────────────────────
// Spec: primary=#163D26, accent=#F5A826, display=Syne 800, body=Nunito 600/700
export const theme = {
  colors: {
    // Brand core
    primary:   '#163D26',    // F&G Deep Green — headers, logo bg, primary actions
    accent:    '#F5A826',    // Amber — CTA buttons, active states, FAB
    accent2:   '#F7D252',    // Yellow — highlights, gradient start
    accent3:   '#E45F10',    // Burnt orange — gradient end, discount badges

    // Neutrals
    background: '#FFFFFF',
    surface:    '#F5F7FA',
    surfaceAlt: '#F0F4EF',   // Slight green tint for category sections
    border:     '#EAEAEA',

    // Text
    text: {
      primary:   '#0D1B14',  // Near-black on white
      secondary: '#6B7280',  // Muted gray
      inverse:   '#FFFFFF',
      accent:    '#F5A826',  // Amber inline text
    },

    // Semantic
    success: '#1A7A3C',
    error:   '#DC3545',
    warning: '#F5A826',
    info:    '#2563EB',

    // Tab bar
    tabActive:   '#163D26',
    tabInactive: '#9CA3AF',

    // Cards
    cardShadowColor: '#163D26',
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
