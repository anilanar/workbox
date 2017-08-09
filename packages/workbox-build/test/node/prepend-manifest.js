const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const expect = require('chai').expect;

const swBuild = require('../../build/index.js');

describe(`Test Prepend Manifest`, function() {
  let tmpDirectory;

  before(function() {
    tmpDirectory = fs.mkdtempSync(
      path.join(__dirname, 'tmp-')
    );
  });

  after(function() {
    fsExtra.removeSync(tmpDirectory);
  });

  const TEST_INPUT_FILE = 'service-worker.js';
  const expectedString = `self.__file_manifest = [
  {
    "url": "index.css",
    "revision": "d41d8cd98f00b204e9800998ecf8427e"
  },
  {
    "url": "index.html",
    "revision": "d41d8cd98f00b204e9800998ecf8427e"
  }
];\n`;
  it(`should be able to read and prepend service worker`, function() {
    const swDest = path.join(tmpDirectory, `sw.js`);
    return swBuild.prependManifest({
      globDirectory: path.join(
        __dirname,
        '..',
        'static',
        'prepend-samples',
        'assets',
      ),
      globPatterns: ['**/*.{html,css}'],
      swSrc: path.join(
        __dirname,
        '..',
        'static',
        'prepend-samples',
        TEST_INPUT_FILE,
      ),
      swDest,
    })
    .then(() => {
      const fileOutput = fs.readFileSync(swDest).toString();
      const manifestPart = fileOutput.substr(0, expectedString.length);
      expect(manifestPart).to.equal(expectedString);
    });
  });
});
