import { classifyMessage } from '../message-classifier';

describe('message-classifier', () => {
  it('classifies a plain conversation as text', () => {
    const r = classifyMessage({ message: { conversation: 'halo' } });
    expect(r.messageType).toBe('text');
    expect(r.text).toBe('halo');
  });

  it('classifies extendedTextMessage as text', () => {
    const r = classifyMessage({ message: { extendedTextMessage: { text: 'world' } } });
    expect(r.messageType).toBe('text');
    expect(r.text).toBe('world');
  });

  it('classifies image with caption', () => {
    const r = classifyMessage({ message: { imageMessage: { caption: 'see pic' } } });
    expect(r.messageType).toBe('image');
    expect(r.text).toBe('see pic');
  });

  it('classifies image without caption (null body)', () => {
    const r = classifyMessage({ message: { imageMessage: {} } });
    expect(r.messageType).toBe('image');
    expect(r.text).toBeNull();
  });

  it('classifies video / audio / document / sticker', () => {
    expect(classifyMessage({ message: { videoMessage: {} } }).messageType).toBe('video');
    expect(classifyMessage({ message: { audioMessage: {} } }).messageType).toBe('audio');
    expect(classifyMessage({ message: { documentMessage: { caption: 'doc' } } }).messageType).toBe('document');
    expect(classifyMessage({ message: { stickerMessage: {} } }).messageType).toBe('sticker');
  });

  it('returns unknown + null on unrecognized envelope', () => {
    expect(classifyMessage(null).messageType).toBe('unknown');
    expect(classifyMessage({ message: { someNewType: {} } }).messageType).toBe('unknown');
  });
});
