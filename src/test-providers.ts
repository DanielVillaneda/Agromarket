// Proveedores globales de Angular para todas las pruebas (opción
// `providersFile` del builder @angular/build:unit-test en angular.json).
// ProductsService y AuthService inyectan HttpClient, así que cualquier
// componente que los use lo necesita. provideHttpClientTesting evita que las
// pruebas hagan peticiones reales: quedan pendientes en HttpTestingController.
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

export default [provideHttpClient(), provideHttpClientTesting()];
