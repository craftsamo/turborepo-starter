export type NavigationVariant = 'docked' | 'floating';

/** Fill of the navigation chrome: opaque, or translucent with a backdrop blur. */
export type NavigationSurface = 'solid' | 'glass';

export interface NavigationVariantProps {
  /** Visual treatment of the navigation chrome. */
  variant?: NavigationVariant;
  /** Fill of the navigation chrome (defaults to `solid`). */
  surface?: NavigationSurface;
}

/** Whether the bottom bar's tabs show their text labels; hidden labels stay as accessible names. */
export type NavigationLabels = 'visible' | 'hidden';

export interface BottomNavProps extends NavigationVariantProps {
  /** Tab labels (defaults to `visible`). */
  labels?: NavigationLabels;
}
