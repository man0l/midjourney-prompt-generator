'use strict';

const path = require('path');

let strapiInstance = null;
let bootPromise = null;

async function getStrapi() {
  if (strapiInstance) return strapiInstance;
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    const { default: strapi } = await import('@strapi/strapi');

    const instance = strapi({
      appDir: path.join(__dirname, '..'),
      distDir: path.join(__dirname, '..', 'dist'),
    });

    await instance.load();
    await instance.server.register();
    await instance.server.initMiddlewares();
    await instance.server.initRouting();

    strapiInstance = instance;
    bootPromise = null;
    return instance;
  })();

  return bootPromise;
}

module.exports = async function handler(req, res) {
  const app = await getStrapi();
  return app.server.app.callback()(req, res);
};
