import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RegistroPage } from './registro.page';

describe('RegistroPage', () => {
  let component: RegistroPage;
  let fixture: ComponentFixture<RegistroPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(RegistroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be invalid when empty', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('should flag mismatched passwords', () => {
    component.form.setValue({
      nombre: 'Ana Torres',
      email: 'ana@example.com',
      telefono: '3001234567',
      password: '123456',
      confirmPassword: 'abcdef',
    });
    expect(component.form.hasError('passwordsMismatch')).toBeTruthy();
  });

  it('should flag an invalid phone number', () => {
    component.form.setValue({
      nombre: 'Ana Torres',
      email: 'ana@example.com',
      telefono: 'abc',
      password: '123456',
      confirmPassword: '123456',
    });
    expect(component.telefono.hasError('pattern')).toBeTruthy();
  });

  it('should be valid with matching data', () => {
    component.form.setValue({
      nombre: 'Ana Torres',
      email: 'ana@example.com',
      telefono: '3001234567',
      password: '123456',
      confirmPassword: '123456',
    });
    expect(component.form.valid).toBeTruthy();
  });
});
