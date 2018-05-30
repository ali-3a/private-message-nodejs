# About this package #

This package provides the server-side scripts for integration of the Drupal
Private Message module with Nodejs.

# Installation Instructions #

1. Install Nodejs on your server.
2. Navigate to the directory that this file resides in.
3. Run `npm install` from this directory.
4. Create the folder [VENDOR FOLDER]/jaypan/config.
5. Create the file [VENDOR FOLDER]/jaypan/config/default.json for the app.

Create default.json by copying either `./http-example.default.json` (for HTTP
connections) or `./https-example.default.json` (for HTTPS connections). Fill in all
the values in the JSON file. Note that you will need to navigate to the Private
Message settings form in Drupal, and copy the Nodejs secret value, to paste into
default.json. If you are using https, you should start with port 8443, and if
you are able to get that working, you can try other ports.

6. Run `node app.js` from this directory. Note that you need to leave this
   program running for the module to work with Nodejs.


## Overriding configuration by environment

If you want to have separate configuration per environment, you can do the
following.

If your environment is production, then in the
[VENDOR FOLDER]/jaypan/private-message-nodejs/config folder, alongside
default.json, you can create production.json. Then, to run your app, you would
do the following:

```
export NODE_ENV=production
node app.js
```

The key here is that NODE_ENV is set to the name of the file without the .json.
So you could do a staging server with staging.json and:

```
export NODE_ENV=staging
node app.js
```
