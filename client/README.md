# Task Manager Frontend

Single page application built with React via CDN. Works with the backend in ../server.
After starting the server, open http://localhost:3001/ in your browser.

The HTML page attempts to load Babel from https://unpkg.com. If that fails,
it automatically falls back to the bundled `babel.min.js`, allowing the app to
work offline once the files have been downloaded.
