# Task Manager Frontend

Single page application built with React via CDN. Works with the backend in ../server.
After starting the server, open http://localhost:3001/ in your browser. The login
screen lets you create an account if you don't already have one.

The HTML page attempts to load Babel from https://unpkg.com. If the CDN is
unavailable, a small script detects that `window.Babel` is undefined and
dynamically loads the bundled `babel.min.js` so the app still works offline
after the first install.
