# iGPlus
Extension for igpmanager game. Chrome and Firefox compatibility

## What it Does
Inject HTML elements into the game website, adding useful shortcuts and quality of life improvments.

### How to test/debug on Firefox:

Rename `manifest-ff.json` (manifest v2 for Firefox) into `manifest.json`, and then use the following commands available in `package.json`:
- `lint:ff` - validates current code for FF
- `run:ff` - launches dev Firefox with the extension loaded. Now you can debug and have fun

### How to test/debug on Chrome:

Switch `developer mode` for extensions, and use `Load unpacked` and point it to `./Extension` subfolder here. Make sure `manifest.json` with v3 is active (see above for `manifest-ff` <--> `manifest`)