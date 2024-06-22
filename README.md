## Oral Eye Dev App

This is the front end development for oral eye cancer scanning project.

### Install

1. Install [node.js](https://nodejs.org/en) and npm if not already installed
2. Clone and install dependencies of the project.

```bash
git clone https://github.com/hjiang36/oraleye-dev-app.git
cd oraleye-test-app
npm install
```

3. Create a `.env` file at the root of project and configure the content with

```
GOOGLE_APPLICATION_CREDENTIALS='Path to Service Account Json File'
GOOGLE_OAUTH_CLIENT_SECRET='Google OAuth Secret'
```

The files / secret can be found on Google Cloud project, or ask Haomiao for the values. Note that the `.env` file should be with `.gitignore` and never commited to Github for security reasons.

4. Run the app in dev mode with

```bash
npm run start
```

If `--openssl-legacy-provider` is not allowed in NODE_OPTIONS error is encountered, try unset the NODE_OPTIONS by `unset NODE_OPTIONS` on Mac and `$env:NODE_OPTIONS=""` on Windows powershell.


### Format & Lint
Proper format and lint check is required before merging the code.
To format code, run
```bash
npm run format
```
To check code format without auto-fixing, run
```bash
npm run lint
```
