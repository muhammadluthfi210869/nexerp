module.exports = {
  toFile: jest.fn().mockResolvedValue(true),
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,...'),
  toString: jest.fn().mockResolvedValue('mock-qr-string'),
};
