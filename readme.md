# Tearless

> Tierless without the tears.

A little experiment.

Define a route in `xxx.route.tsx` to map it to `/xxx` or `index.route.tsx` for `/`.

You can default export a React component, which will rendered on server-side and be served in an HTML file.

Or you can `export default definePage(getOrMethods, component?, displayName?)`:

`getOrMethods` is either a function or an object with methods in it. If it's a function, it will be interpreted as if it was an object with a `get` method.

`get`'s return value will be passed to the component as `props.data`.

All methods (including `get`) will be available to the component as `props.methods` with their return values turned into promises. They will be available as RPC functions and they will always run on the server. Arguments and return values are serialized/deserialized with `@brillout/json-s`.

Methods have access to the “context” via `this`. Currently it's just `{ req }` to demonstrate the idea.

The demo app writes a `data.json` file in the current directory.

No validation or error handling is performed.

It can use a little Babel plugin to remove the methods from the client bundle but it requires [this PR](https://github.com/vitejs/vite/pull/6238). It's not required, though, Vite injects a stub for `fs` and everything works fine.

The plugin can't handle all cases yet. But it seems to be doable to make it work in most cases.

TODO:
- Prod build (should work, I just didn't have the time).
- ~~A vite plugin so we can import other `.route.tsx` files and have access to their methods. Direct call on the server, RPC proxy on the client. Return type is easy to define, the proxy should also be fairly straightforward to implement.~~

	EDIT: This is not needed. Just use plain import and use them in your methods. Ideally, the methods object should be your only window to the server-side.

- HTML escaping, error handling, validation, etc.
