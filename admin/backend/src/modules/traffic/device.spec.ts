import { cleanHost, cleanPath, deviceOf, isBot } from './device';

describe('traffic helpers', () => {
  it('classifies devices', () => {
    expect(deviceOf('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe('mobile');
    expect(deviceOf('Mozilla/5.0 (iPad; CPU OS 17_0)')).toBe('tablet');
    expect(deviceOf('Mozilla/5.0 (X11; Linux x86_64)')).toBe('desktop');
  });
  it('detects bots', () => {
    expect(isBot('Googlebot/2.1')).toBe(true);
    expect(isBot('')).toBe(true);
    expect(isBot('Mozilla/5.0 (X11; Linux x86_64) Firefox/130')).toBe(false);
  });
  it('cleans paths and hosts', () => {
    expect(cleanPath('/shop?x=1#a')).toBe('/shop');
    expect(cleanPath('javascript:alert(1)')).toBe('/');
    expect(cleanHost('https://www.Facebook.com/path')).toBe('facebook.com');
    expect(cleanHost('<script>')).toBeNull();
  });
});
