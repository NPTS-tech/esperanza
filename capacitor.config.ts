import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL || 'https://esperanza.npts.tech';
const isDev = process.env.NODE_ENV === 'development' || !!process.env.CAPACITOR_SERVER_URL?.includes('http://');

const config: CapacitorConfig = {
  appId: 'tech.npts.esperanza',
  appName: 'Esperanza',
  webDir: 'public',
  server: {
    url: serverUrl,
    cleartext: isDev,
    errorPath: 'offline.html',
    allowNavigation: [
      'esperanza.npts.tech',
      '*.npts.tech',
      'localhost',
      '10.0.2.2',
      '127.0.0.1',
    ],
  },
  android: {
    backgroundColor: '#FAF7F2',
    allowMixedContent: isDev,
  },
  ios: {
    backgroundColor: '#FAF7F2',
    contentInset: 'automatic',
  },
};

export default config;
