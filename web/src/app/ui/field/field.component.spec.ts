import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { axe } from 'jest-axe';
import { ControlDirective, FieldComponent } from './field.component';

@Component({
  standalone: true,
  imports: [FieldComponent, ControlDirective, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <ui-field label="Email" hint="We'll send your confirmation here" [error]="emailError">
        <input uiControl type="email" formControlName="email" />
      </ui-field>
      <ui-field label="Delivery address">
        <textarea uiControl formControlName="address"></textarea>
      </ui-field>
    </form>
  `,
})
class HostComponent {
  emailError: string | null = null;
  form = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
  });
}

describe('FieldComponent (ui-field) and uiControl', () => {
  let fixture: ComponentFixture<HostComponent>;
  let root: HTMLElement;
  let email: HTMLInputElement;
  let address: HTMLTextAreaElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    root = fixture.nativeElement;
    email = root.querySelector('input')!;
    address = root.querySelector('textarea')!;
  });

  function setError(error: string | null) {
    fixture.componentInstance.emailError = error;
    fixture.detectChanges();
  }

  function describedByText(control: HTMLElement): string[] {
    const ids = control.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map((id) => root.querySelector(`#${id}`)?.textContent?.trim() ?? `missing #${id}`);
  }

  it('labels each control with a unique id', () => {
    const labels = root.querySelectorAll('label');

    expect(labels[0].textContent?.trim()).toBe('Email');
    expect(labels[0].htmlFor).toBe(email.id);
    expect(labels[1].htmlFor).toBe(address.id);
    expect(email.id).not.toBe(address.id);
  });

  it('links the hint to the control', () => {
    expect(describedByText(email)).toEqual(["We'll send your confirmation here"]);
  });

  it('adds no aria-describedby when there is no hint or error', () => {
    expect(address.hasAttribute('aria-describedby')).toBe(false);
  });

  it('is not marked invalid without an error', () => {
    expect(email.hasAttribute('aria-invalid')).toBe(false);
  });

  describe('with an error', () => {
    beforeEach(() => setError('Enter an email address like name@example.com'));

    it('links the hint and then the error to the control', () => {
      expect(describedByText(email)).toEqual([
        "We'll send your confirmation here",
        'Error: Enter an email address like name@example.com',
      ]);
    });

    it('marks the control invalid', () => {
      expect(email.getAttribute('aria-invalid')).toBe('true');
    });

    it('prefixes the message with hidden "Error:" so it is not colour alone', () => {
      const prefix = root.querySelector('.ui-field__error .visually-hidden');

      expect(prefix?.textContent).toBe('Error: ');
    });

    it('clears everything when the error goes', () => {
      setError(null);

      expect(email.hasAttribute('aria-invalid')).toBe(false);
      expect(describedByText(email)).toEqual(["We'll send your confirmation here"]);
    });
  });

  it('works with typed reactive forms', () => {
    email.value = 'ada@example.com';
    email.dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.form.controls.email.value).toBe('ada@example.com');
  });

  it('has no axe violations, with or without an error', async () => {
    expect(await axe(root)).toHaveNoViolations();

    setError('Enter an email address');
    expect(await axe(root)).toHaveNoViolations();
  });
});
