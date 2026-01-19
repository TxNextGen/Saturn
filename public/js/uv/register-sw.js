"use strict";
/**
 * Distributed with Ultraviolet and compatible with most configurations.
 * Modified to support both UV and Scramjet backends.
 */
const stockSW = "/uv/sw.js";
const scramjetSW = "/js/scramjet/scramjet.worker.js";

/**
 * List of hostnames that are allowed to run serviceworkers on http://
 */
const swAllowedHostnames = ["localhost", "127.0.0.1"];

/**
 * Global util
 * Used in 404.html and index.html
 */
async function registerSW() {
  if (!navigator.serviceWorker) {
    if (
      location.protocol !== "https:" &&
      !swAllowedHostnames.includes(location.hostname)
    )
      throw new Error("Service workers cannot be registered without https.");

    throw new Error("Your browser doesn't support service workers.");
  }

  const proxyBackend = window.currentProxyBackend || 'uv';

  if (proxyBackend === 'scramjet') {
    await navigator.serviceWorker.register(scramjetSW, {
      scope: "/scram/",
    });
  } else {
    await navigator.serviceWorker.register(stockSW, {
      scope: __uv$config.prefix,
    });
  }
}