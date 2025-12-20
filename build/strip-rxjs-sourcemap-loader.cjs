/**
 * Webpack loader that removes trailing sourceMappingURL comments from RxJS
 * modules so the dev server doesn't emit 404s for missing .map files.
 */
module.exports = function stripSourceMapComments(source) {
  return source
    .replace(/\/\/[#@]\s*sourceMappingURL=.*$/gm, '')
    .replace(/\/\*[#@]\s*sourceMappingURL=.*?\*\//gm, '');
};
