'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const isValidInput = require('./utils/is-valid-input');
const getFileManifestEntries = require('./get-file-manifest-entries');
const errors = require('./errors');

/**
 * This method will read an existing service worker file and prepend it with
 * an array of assets to precache. The array is assigned to
 * `self.__file_manifest`. This allows the service worker to use the manifest
 * for other purposes or mutate it before precaching.
 *
 * @param {Object} input
 * @param {String} input.swSrc File path and name of the service worker file
 * to read and inject the manifest into before writing to `swDest`.
 * @param {String} input.globDirectory The directory you wish to run the
 * `globPatterns` against.
 * @param {Array<String>} input.globPatterns Files matching against any of
 * these glob patterns will be included in the file manifest.
 *
 * Defaults to ['**\/*.{js,css}']
 * @param {String|Array<String>} [input.globIgnores] Files matching against any
 * of these glob patterns will be excluded from the file manifest, even if the
 * file matches against a `globPatterns` pattern. Defaults to ignoring
 * 'node_modules'.
 * @param {Object<String,Array|String>} [input.templatedUrls]
 * If a URL is rendered with templates on the server, its contents may
 * depend on multiple files. This maps URLs to an array of file names, or to a
 * string value, that uniquely determines the URL's contents.
 * @param {String} [input.modifyUrlPrefix] An object of key value pairs
 * where URL's starting with the key value will be replaced with the
 * corresponding value.
 * @param {number} [input.maximumFileSizeToCacheInBytes] This value can be used
 * to determine the maximum size of files that will be precached.
 *
 * Defaults to 2MB.
 * @param {RegExp} [input.dontCacheBustUrlsMatching] An optional regex that will
 * return a URL string and exclude the revision details for urls matching this
 * regex. Useful if you have assets with file revisions in the URL.
 * @param {Array<ManifestTransform>} [input.manifestTransforms] A list of
 * manifest transformations, which will be applied sequentially against the
 * generated manifest. If `modifyUrlPrefix` or `dontCacheBustUrlsMatching` are
 * also specified, their corresponding transformations will be applied first.
 * @return {Promise} Resolves once the service worker has been written
 * with the prepended precache list.
 *
 * @example <caption>Prepend a manifest of static assets, which could
 * then be used with a service worker.</caption>
 * const swBuild = require('workbox-build');
 *
 * swBuild.prependManifest({
 *   globDirectory: './build/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html'],
 *   swSrc: './src/sw.js',
 *   swDest: './build/sw.js',
 *   manifestVariable: 'assetManifest',
 * })
 * .then(() => {
 *   console.log('Build Manifest generated.');
 * });
 *
 * @memberof module:workbox-build
 */
const prependManifest = (input) => {
  if (!isValidInput(input)) {
    return Promise.reject(
      new Error(errors['invalid-prepend-manifest-arg']));
  }

  return getFileManifestEntries(input)
  .then((manifestEntries) => {
    let swFileContents = fs.readFileSync(input.swSrc, 'utf8');

    const entriesString = JSON.stringify(manifestEntries, null, 2);
    swFileContents =
      `self.__file_manifest = ${entriesString};\n${swFileContents}`;

    return new Promise((resolve, reject) => {
      mkdirp(path.dirname(input.swDest), (err) => {
        if (err) {
          return reject(
            new Error(
              errors['unable-to-make-sw-directory'] +
              ` '${err.message}'`
            )
          );
        }
        resolve();
      });
    })
    .then(() => {
      fs.writeFileSync(input.swDest, swFileContents);
    });
  });
};

module.exports = prependManifest;
