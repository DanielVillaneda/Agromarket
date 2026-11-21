// Polyfills for running unit tests under jsdom (the default Vitest environment).
// Ionic components such as ion-menu and ion-split-pane query `window.matchMedia`,
// which jsdom does not implement.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Desde Node 25, Node define su propio `localStorage` global, que sin
// --localstorage-file queda sin almacenamiento y tapa el de jsdom. AuthService
// lo lee al crearse, así que se reemplaza por uno en memoria. Se vacía antes de
// cada prueba para que ninguna herede la sesión de otra.
function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string) => void data.delete(key),
    setItem: (key: string, value: string) => void data.set(key, String(value)),
  };
}

let storageWorks = false;
try {
  globalThis.localStorage.setItem('__prueba__', '1');
  globalThis.localStorage.removeItem('__prueba__');
  storageWorks = true;
} catch {
  storageWorks = false;
}

if (!storageWorks) {
  const memoryStorage = createMemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true, writable: true });
  Object.defineProperty(window, 'localStorage', { value: memoryStorage, configurable: true, writable: true });
}

beforeEach(() => {
  localStorage.clear();
});
