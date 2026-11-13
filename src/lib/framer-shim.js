/**
 * framer-shim — minimal stand-in for the `framer` runtime.
 *
 * Components published for the Framer marketplace import three symbols from
 * "framer". When they run outside the Framer editor (plain Vite/React), this
 * shim supplies them so the component works as normal React.
 *
 * - addPropertyControls: records the editor metadata on the component (no-op at runtime)
 * - ControlType:         metadata enum keys used by the controls definition
 * - useIsStaticRenderer: false = live/interactive mode (not a static canvas export)
 *
 * Aliased to "framer" in vite.config.js.
 */

export function addPropertyControls(component, controls) {
  if (component) component.propertyControls = controls;
  return controls;
}

export const ControlType = {
  Array: 'array',
  Boolean: 'boolean',
  BoxShadow: 'boxShadow',
  Color: 'color',
  Enum: 'enum',
  EventHandler: 'eventHandler',
  File: 'file',
  Font: 'font',
  FramerId: 'framerId',
  Image: 'image',
  Link: 'link',
  Number: 'number',
  Object: 'object',
  Padding: 'padding',
  ResponsiveImage: 'responsiveImage',
  String: 'string',
  Transition: 'transition',
  borderRadius: 'borderRadius'
};

export function useIsStaticRenderer() {
  return false;
}
