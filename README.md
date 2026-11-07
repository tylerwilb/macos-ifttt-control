![Next Loader](./src/assets/banner.jpg)

#  macOS IFTTT Control

> This project has been abandoned. An appropriate replacement will be announced in the future.

**macOS IFTTT Control** – macOS IFTTT Control is a free, open source service for
macOS that allows users to perform tasks and automate processes on their Macs
in conjunction with different services using IFTTT.

With macOS IFTTT Control you don't need to worry about installing web servers
on your Mac or having to configure port forwarding on your router or get a
dedicated IP address, since macOS IFTTT Control uses the power of DropBox to work,
which makes macOS IFTTT Control capable of working on any Mac with an internet
connection.

## Features
### IFTTT Applets
We provide some pre-made applets on our website but you can make your own applets
using almost everything services available in IFTTT, giving you the possibility
to automate your Mac.

### Webhooks Events
You want to trigger an applet? macOS IFTTT Control support Webhooks events, when an
event it's invoked using macOS IFTTT Control, the registered Webhook for that event
will be triggered.

### Voice Control with your Favourite Assistant
The reason why I created this project. Now you can control your Mac using Google
Assistant, Amazon Alexa or even Cortana. Sleep your Mac, Change the volume and much
more using only your voice.

## Use Pre-Made Applets and Make your own Applets
You can start using macOS IFTTT Control today using our pre-made applets or you can
create your own applets by checking our documentation [here](https://github.com/abdyfranco/macos-ifttt-control/wiki).

##### Donate any amount:
 - [PayPal](https://www.paypal.me/abdyfranco)
 - [Bitcoin](https://www.blockchain.com/btc/payment_request?address=1LMLf1JDouaeEwpUxsH6PpFptYM4LB7b9B) 

## Copyright
- Copyright (c) 2017-2019 [Abdy Franco](http://abdyfran.co/)

## Development checks

Use a supported Node.js release for dependency installation and packaging (Node.js 24
recommended). The plist/XML tooling used by `electron-packager` requires Node.js
14.6 or newer on the **build host**; it is not imported by the Electron application.
The Electron 42 installer requires build-host Node.js 22.12 or newer.
The Electron runtime version is pinned separately in `src/app/package-lock.json`.

```sh
cd src/app
npm ci --ignore-scripts
npm run test:deps
node node_modules/electron-packager/cli.js . "macOS IFTTT Control" --platform=mas --arch=x64 --out=/tmp/macos-ifttt-package
```

The last command downloads the pinned Electron binary and creates an unsigned app
bundle only. It does not run the CLI installer or register a service. MAS signing,
macOS launch/UI checks, and any live automation validation are separate release
gates. Do not use `src/build.sh` for isolated dependency checks: that script also
fetches the CLI service tools.

### Electron 42 migration gate

The renderer still uses legacy Node-enabled local pages. Explicit compatibility
preferences preserve that behavior; this is not a context-isolation security
redesign. Main-process navigation is limited to the three bundled pages, popup
windows are blocked, and the quit IPC accepts only the current local main frame.

Run `npm test` for offline compatibility checks. Before merging the major Electron
upgrade, qualify launch, onboarding navigation, populated and empty webhook/event
views, modal cancel/reopen, update-page loading, menus and quit on a supported Mac
with an isolated synthetic HOME and all external requests/commands intercepted.
Do not register a service, run an updater, or send real IFTTT/device requests during
these checks. Unsigned cross-platform packaging is not macOS runtime validation.
