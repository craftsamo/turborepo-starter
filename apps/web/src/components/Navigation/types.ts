export type NavigationVariant = 'docked' | 'floating';

/** Fill of the navigation chrome: opaque, or translucent with a backdrop blur. */
export type NavigationSurface = 'solid' | 'glass';

export interface NavigationVariantProps {
  /** Visual treatment of the navigation chrome. */
  variant?: NavigationVariant;
  /** Fill of the navigation chrome (defaults to `solid`). */
  surface?: NavigationSurface;
}
