settings = {
  scheme: 'http',
  port: 8080,
  host: '0.0.0.0',
  resource: '/socket.io',
  serviceKey: 'hI0g2Yf9Rs8Dm5',
  backend: {
    port: 80,
    host: 'labs7.gs-internet.net',
    scheme: 'http',
    basePath: '/chouhoudway/portal',
    messagePath: '/nodejs/message'
  },
  debug: false,
  sslKeyPath: '',
  sslCertPath: '',
  sslCAPath: '',
  baseAuthPath: '/nodejs/',
  extensions: [],
  clientsCanWriteToChannels: false,
  clientsCanWriteToClients: false,
  transports: ['websocket', 'polling'],
  jsMinification: true,
  jsEtag: true,
  logLevel: 1
};
