---
name: pruebas-desde-criterios-aceptacion
description: Usar cuando haya que convertir un criterio de aceptación (Given/When/Then) de AgroMarket en una prueba real, o cuando se pida "probar", "verificar" o "escribir el test" de una historia de usuario. En el backend se documenta un comando curl con su resultado esperado; en el frontend se escribe un .spec.ts que verifica el signal de ProductsService/AuthService ante una acción del usuario. Prohíbe pruebas vacías, tautológicas o que solo verifican un mock.
---

# Pruebas desde criterios de aceptación en AgroMarket

Un criterio de aceptación solo cuenta como probado si existe una prueba que **falla cuando el criterio no se cumple**. Este documento explica cómo pasar de un Given/When/Then a esa prueba en cada lado del proyecto.

## 1. Descomponer el criterio

Antes de escribir código, separa el criterio en tres partes y tradúcelas:

| Parte | Qué es | Backend (curl) | Frontend (.spec.ts) |
|---|---|---|---|
| **Given** (dado) | Estado inicial | Usuario del seed con sesión (token) y datos previos creados con otros curl | Sesión en `localStorage` y respuestas iniciales del API servidas con `HttpTestingController` |
| **When** (cuando) | Acción del usuario | Un solo request al endpoint | Una llamada al método del servicio o del page que dispara la acción (`addToCart`, `toggleFavorite`, clic) |
| **Then** (entonces) | Resultado observable | Código HTTP + cuerpo JSON exacto (o el campo clave) | `expect` sobre el signal o el getter que lee el signal (`getCartQuantity(id)`, `cartCount()`, `isFavorite(id)`) |

Si el **Then** no se puede expresar como un valor concreto (un número, un booleano, un mensaje exacto, un código HTTP), el criterio está mal escrito. Pide que se aclare antes de inventar una prueba.

Cada criterio produce también su **caso negativo** cuando aplique (por ejemplo, "no puedo agregar mi propio producto"). Ese caso se prueba igual que el positivo.

## 2. Backend: comando curl documentado

El backend no tiene suite de pruebas. La prueba de un criterio es un bloque curl reproducible con su **resultado esperado escrito al lado**. Se deja en la descripción del PR o en la historia, no en un archivo de código.

Requisitos:
- Backend corriendo (`cd backend && npm run dev`) con la base sembrada (`npm run prisma:seed`). Todas las cuentas del seed usan la contraseña `agromarket123`.
- Mostrar siempre el código HTTP con `-w '\n%{http_code}\n'`. Un criterio sin código esperado no está probado.
- El resultado esperado incluye el código y el cuerpo exacto, o al menos el campo que decide el criterio. Los errores salen como `{ "message": "..." }` (ver `middleware/errorHandler.ts`). Copia el mensaje en español tal cual.
- Después de la acción, si el criterio habla de un estado (por ejemplo "queda en el carrito"), haz un segundo curl de lectura (`GET`) que lo confirme. La respuesta del `POST` sola no demuestra que se guardó.

### Ejemplo

> **Given** María tiene sesión iniciada y su carrito vacío,
> **When** agrega 2 kilos de un producto de otro vendedor,
> **Then** el carrito tiene 1 producto con cantidad 2.

```bash
API=http://localhost:3000/api

# Given: sesión de María
TOKEN=$(curl -s -X POST $API/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"maria.gomez@agromarket.co","password":"agromarket123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# Given: carrito vacío (y un producto ajeno; GET /products ya excluye los propios)
curl -s -X DELETE $API/cart -H "Authorization: Bearer $TOKEN" -o /dev/null
ID=$(curl -s $API/products -H "Authorization: Bearer $TOKEN" \
  | node -pe 'JSON.parse(require("fs").readFileSync(0))[0].id')

# When
curl -s -X POST $API/cart/$ID -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"quantity":2,"unit":"kilo"}' \
  -w '\n%{http_code}\n'
# Esperado: {"quantity":2,"unit":"kilo"}
#           201

# Then: el estado quedó guardado
curl -s $API/cart -H "Authorization: Bearer $TOKEN" -w '\n%{http_code}\n'
# Esperado: "count":1 y el ítem con "quantity":2
#           200
```

Caso negativo del mismo criterio (comprar un producto propio, con la sesión de `demo@agromarket.co` y un id de `GET /api/products/mine`):

```bash
curl -s -X POST $API/cart/$ID_PROPIO -H "Authorization: Bearer $TOKEN_DEMO" \
  -H 'Content-Type: application/json' -d '{"quantity":1}' -w '\n%{http_code}\n'
# Esperado: {"message":"No puedes comprar tu propio producto."}
#           400
```

Para que cuente, el bloque debe poder ejecutarse completo de arriba abajo, sin pasos manuales escondidos ni ids inventados.

## 3. Frontend: spec que verifica el signal

El estado vive en signals de `ProductsService` y `AuthService` (ver `CLAUDE.md`). El spec verifica **el signal que la UI lee** después de la acción del usuario. No verifica que se llamó a un método.

Nombres reales en `ProductsService`. No inventes otros:
- Carrito: `getCartQuantity(id)`, `isInCart(id)`, `getCartUnit(id)`, `cartItems()`, `cartCount()`, `cartTotal()`. **No existe `cartQuantity()`.**
- Favoritos: `isFavorite(id)`, `favoriteProducts()`.
- Otros: `isPurchased(id)`, `purchasedProducts()`, `myProducts()`, `marketProducts()`, `recentlyViewedProducts()`.
- Sesión: `AuthService.isAuthenticated()`, `isAdmin()`, `currentUser()`.

Reglas:
- La única frontera que se simula es **HTTP**, con `provideHttpClient()` + `provideHttpClientTesting()` y `HttpTestingController`. La respuesta que se sirve con `flush` debe tener la forma real del backend (`ApiProduct`, `{ items, total, count }`, etc.). Así se ejercita el código real del servicio (`mapProduct`, `loadCart`, el cambio optimista de favoritos).
- No reemplaces `ProductsService` ni `AuthService` con un objeto falso cuando el criterio trata de su comportamiento.
- El `effect` del servicio dispara las cargas al iniciar. Llama a `TestBed.tick()` y responde todas esas peticiones en el `beforeEach`. En `afterEach`, `http.verify()` asegura que no quedó ninguna petición sin atender.
- Con Node ≥ 25, `localStorage` global no existe dentro de Vitest. Simúlalo con `vi.stubGlobal` como en el ejemplo (es entorno, no el sujeto de la prueba).
- Verifica el estado **antes** del When (por ejemplo `toBe(0)`) y **después**. Así se demuestra que la acción produjo el cambio.
- El nombre del `it` es el criterio: `'Given ..., When ..., Then ...'`.

### Ejemplo (`src/app/services/products.service.spec.ts`)

```ts
import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ProductsService } from './products.service';
import { Product } from '../components/product-card/product-card.component';
import { environment } from '../../environments/environment';

const api = environment.apiUrl;

function apiProduct(id: number) {
  return {
    id, title: 'Café', price: 12000, location: 'Huila', icon: 'leaf', accent: '#2e7d32',
    description: null, quantity: 10, unit: 'kilo', photos: [], sellerId: 2,
    sellerName: 'Carlos', sellerPhone: '3000000000', sellerEmail: 'carlos.perez@agromarket.co',
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('ProductsService: criterios de carrito y favoritos', () => {
  let service: ProductsService;
  let http: HttpTestingController;

  beforeEach(() => {
    // Given: usuario con sesión (AuthService la lee de localStorage al iniciar)
    const datos = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => datos.get(k) ?? null,
      setItem: (k: string, v: string) => void datos.set(k, v),
      removeItem: (k: string) => void datos.delete(k),
      clear: () => datos.clear(),
    });
    localStorage.setItem('agromarket_token', 'token-de-prueba');
    localStorage.setItem('agromarket_user', JSON.stringify({
      id: 1, nombre: 'María', email: 'maria.gomez@agromarket.co', telefono: null, role: 'user',
    }));

    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductsService);
    http = TestBed.inject(HttpTestingController);

    // Given: carrito y favoritos vacíos (respuesta a las cargas del effect)
    TestBed.tick();
    http.match(() => true).forEach((req) =>
      req.flush(req.request.url === `${api}/cart` ? { items: [], total: 0, count: 0 } : []),
    );
  });

  afterEach(() => {
    http.verify();
    vi.unstubAllGlobals();
  });

  it('Given carrito vacío, When agrega 2 kilos del producto 7, Then getCartQuantity(7) es 2', () => {
    expect(service.getCartQuantity(7)).toBe(0);

    service.addToCart(7, 2, 'kilo').subscribe();
    http.expectOne({ method: 'POST', url: `${api}/cart/7` }).flush({ quantity: 2, unit: 'kilo' });
    http.expectOne(`${api}/cart`).flush({
      items: [{ product: apiProduct(7), quantity: 2, unit: 'kilo' }], total: 24000, count: 1,
    });

    expect(service.getCartQuantity(7)).toBe(2);
    expect(service.cartCount()).toBe(1);
  });

  it('Given el producto 7 no es favorito, When lo marca, Then isFavorite(7) es true al instante', () => {
    expect(service.isFavorite(7)).toBe(false);

    service.toggleFavorite(7, { id: 7 } as Product).subscribe();
    expect(service.isFavorite(7)).toBe(true); // cambio optimista, antes de la respuesta

    http.expectOne({ method: 'POST', url: `${api}/favorites/7` }).flush({ isFavorite: true });
    http.expectOne(`${api}/favorites`).flush([apiProduct(7)]);
    expect(service.isFavorite(7)).toBe(true);
  });
});
```

Correr solo ese archivo:

```bash
npx ng test --watch=false --include src/app/services/products.service.spec.ts
```

Si el criterio se prueba desde un page (por ejemplo, el botón "Agregar" de `carritocompras`), aplica lo mismo: crea el componente con los mismos providers, dispara la acción del page (método o `click()` sobre el botón) y verifica el signal del servicio inyectado con `TestBed.inject(ProductsService)`.

## 4. Comprobar que la prueba puede fallar

Una prueba que nunca vimos fallar no prueba nada. Antes de dar el criterio por cubierto:

1. Ejecuta la prueba y confírmala en verde.
2. Rompe a propósito la regla del criterio, en local y sin commitear. Por ejemplo, en `loadCart` asigna `quantity: 0`, o quita la actualización optimista de `toggleFavorite`. En el backend, comenta la validación del endpoint.
3. Ejecuta de nuevo. La prueba **debe ponerse en rojo** con un mensaje que apunte al criterio (por ejemplo, `expected +0 to be 2`). En curl, el código o el cuerpo deben dejar de coincidir con el esperado.
4. Revierte el cambio (`git checkout -- <archivo>`) y confirma que vuelve a verde.

Si en el paso 3 sigue en verde, la prueba no sirve y hay que rehacerla.

## 5. Prohibido

Ninguna de estas pruebas cuenta como cobertura de un criterio. Si las encuentras en un cambio, señálalas y reemplázalas:

- **Pruebas vacías.** Un `it` sin `expect`, con el cuerpo comentado, `it.todo`/`it.skip` presentados como cubiertos, o un curl sin resultado esperado escrito.
- **Pruebas tautológicas.** Las que pasan siempre, sin importar el código: `expect(true).toBe(true)`, `expect(component).toBeTruthy()` como única verificación de un criterio, comparar un valor consigo mismo, o esperar exactamente el dato que la propia prueba acaba de asignar al signal sin pasar por la acción del usuario.
- **Pruebas que solo verifican un mock.** Reemplazar `ProductsService` por un objeto falso y luego verificar `toHaveBeenCalled()` o el valor que devuelve ese falso. Eso prueba el mock, no AgroMarket. Lo que se verifica es el signal real después de la acción.
- **Ajustar el esperado al resultado actual.** Si la prueba falla, se corrige el código o se aclara el criterio. No se copia la salida actual como "esperado".
- **curl contra datos inventados.** Ids escritos a mano que no salen de un request anterior, o pasos que dependen de algo hecho a mano en Prisma Studio.

## 6. Checklist antes de entregar

- [ ] Cada criterio tiene su Given, When y Then traducidos (tabla de la sección 1).
- [ ] Backend: bloque curl ejecutable de arriba abajo, con código HTTP y cuerpo esperados, más un `GET` de confirmación cuando el criterio habla de estado.
- [ ] Frontend: `.spec.ts` que dispara la acción real y verifica el signal antes y después. Solo HTTP está simulado.
- [ ] Se vio la prueba fallar con el criterio roto (sección 4) y volver a verde.
- [ ] Ninguna prueba cae en la lista de prohibidos (sección 5).
- [ ] Nombres de prueba, comentarios y mensajes en español.
