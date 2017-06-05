function randomInt(min, max) {
  const minInt = Math.ceil(min);
  const maxInt = Math.floor(max);

  return Math.floor(Math.random() * (maxInt - minInt)) + minInt;
}


module.exports = randomInt;
