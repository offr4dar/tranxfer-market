// stubs/react-dom.js
// react-dom is a web dependency pulled in by @clerk/clerk-react.
// In React Native it is never actually called at runtime — this stub
// satisfies the module resolver without bundling any web code.
module.exports = {
  createPortal: () => null,
  render: () => null,
  unmountComponentAtNode: () => null,
  findDOMNode: () => null,
  flushSync: (fn) => fn && fn(),
  createRoot: () => ({ render: () => null, unmount: () => null }),
};
