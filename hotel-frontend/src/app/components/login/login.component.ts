import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { HotelService } from '../../services/hotel.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  @Output() loggedIn = new EventEmitter<void>();

  // UI state
  isLoginMode = true;
  loading = false;
  error = '';
  showPwd = false;
  showConfirm = false;

  // form
  form = new FormGroup({
    username: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    password: new FormControl<string>('', { validators: [Validators.required, Validators.minLength(6)], nonNullable: true }),
    confirmPassword: new FormControl<string>('', { nonNullable: true })
  });

  constructor(private api: HotelService) {
    this.syncValidatorsForMode();
  }

  // toggle login/signup
  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.error = '';
    this.syncValidatorsForMode();
    this.form.reset({
      username: '',
      password: '',
      confirmPassword: ''
    });
  }

  private syncValidatorsForMode() {
    const confirm = this.form.controls.confirmPassword;
    if (this.isLoginMode) {
      confirm.clearValidators();
      confirm.disable({ emitEvent: false });
    } else {
      confirm.enable({ emitEvent: false });
      confirm.setValidators([Validators.required, Validators.minLength(6)]);
    }
    confirm.updateValueAndValidity({ emitEvent: false });
  }

  // strength meter 0-4
  get passwordScore(): number {
    const v = this.form.controls.password.value || '';
    let s = 0;
    if (v.length >= 6) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[a-z]/.test(v)) s++;
    if (/\d|[^A-Za-z0-9]/.test(v)) s++;
    return s;
  }

  strengthLabel(score: number) {
    return ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'][score] || 'Too weak';
  }

  async doLogin() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = '';
    try {
      const { username, password } = this.form.getRawValue();
      const res = await firstValueFrom(this.api.login(username, password));
      if (res?.token) {
        this.api.setToken(res.token, res.username);
        this.loggedIn.emit();
      }
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Login failed';
    } finally {
      this.loading = false;
    }
  }

  async doSignup() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { username, password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    this.loading = true; this.error = '';
    try {
      await firstValueFrom(this.api.signup(username, password, confirmPassword));
      await this.doLogin(); // auto-login
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Signup failed';
    } finally {
      this.loading = false;
    }
  }

  submit() {
    this.isLoginMode ? this.doLogin() : this.doSignup();
  }
}