module.exports = (input) => input
  && typeof input === 'object'
  && !Array.isArray(input);
