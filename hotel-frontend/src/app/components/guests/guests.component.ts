import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { HotelService, Guest } from '../../services/hotel.service';

@Component({
  selector: 'app-guests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgForOf, NgIf],
  templateUrl: './guests.component.html'
})
export class GuestsComponent implements OnInit {
  guests: Guest[] = [];
  view: Guest[] = [];
  q = '';

  editingId: number | null = null;
  formOpen = false;
  confirmDelete: Guest | null = null;

  error = '';
  saving = false;
  loading = true;

  form!: FormGroup<{
    fullName: FormControl<string>;
    email: FormControl<string>;
    phone: FormControl<string>;
  }>;

  constructor(private api: HotelService) {
    this.form = new FormGroup({
      fullName: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
      email: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          // basic email shape; keep it light to avoid false positives
          (c) => !c.value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.value) ? null : { email: true }
        ]
      }),
      phone: new FormControl<string>('', { nonNullable: true }),
    });
  }

  ngOnInit(): void { this.load(); }

  async load() {
    this.loading = true; this.error = '';
    try {
      const guests = await firstValueFrom(this.api.getGuests());
      this.guests = guests ?? [];
      this.view = this.guests.slice();
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to load guests';
    } finally {
      this.loading = false;
    }
  }

  // UI helpers
  startCreate() {
    this.editingId = null;
    this.formOpen = true;
    this.form.reset({ fullName: '', email: '', phone: '' });
  }

  cancelForm() {
    this.formOpen = false;
    this.editingId = null;
    this.form.reset({ fullName: '', email: '', phone: '' });
  }

  filter() {
    const t = (this.q || '').toLowerCase().trim();
    if (!t) { this.view = this.guests.slice(); return; }
    this.view = this.guests.filter(g =>
      g.fullName.toLowerCase().includes(t) ||
      (g.email ?? '').toLowerCase().includes(t) ||
      (g.phone ?? '').toLowerCase().includes(t)
    );
  }

  askDelete(g: Guest) {
    this.confirmDelete = g;
  }

  // CRUD
  async addGuest() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.error = '';
    try {
      const created = await firstValueFrom(this.api.addGuest(this.form.getRawValue()));
      if (created) {
        this.guests.unshift(created);
        this.filter();
        this.cancelForm();
      }
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to add guest';
    } finally { this.saving = false; }
  }

  edit(g: Guest) {
    this.editingId = g.id;
    this.formOpen = true;
    this.form.setValue({
      fullName: g.fullName,
      email: g.email ?? '',
      phone: g.phone ?? ''
    });
  }

  async saveEdit() {
    if (this.editingId == null || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.error = '';
    try {
      const updated = await firstValueFrom(this.api.updateGuest(this.editingId, this.form.getRawValue()));
      if (updated) {
        const idx = this.guests.findIndex(x => x.id === this.editingId);
        if (idx >= 0) this.guests[idx] = updated;
        this.filter();
        this.cancelForm();
      }
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to update guest';
    } finally { this.saving = false; }
  }

  async remove(g: Guest) {
    if (!g) return;
    this.saving = true; this.error = '';
    try {
      await firstValueFrom(this.api.deleteGuest(g.id));
      this.guests = this.guests.filter(x => x.id !== g.id);
      this.filter();
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to delete guest';
    } finally {
      this.saving = false;
      this.confirmDelete = null;
    }
  }
}