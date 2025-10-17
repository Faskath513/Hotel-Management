import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { FormsModule } from '@angular/forms'; // for [(ngModel)] search
import { firstValueFrom } from 'rxjs';
import { HotelService, Room } from '../../services/hotel.service';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgForOf, NgIf],
  templateUrl: './rooms.component.html'
})
export class RoomsComponent implements OnInit {
  rooms: Room[] = [];
  view: Room[] = [];
  q = '';

  editingId: number | null = null;
  formOpen = false;
  confirmDelete: Room | null = null;

  error = '';
  saving = false;
  loading = true;

  form!: FormGroup<{
    name: FormControl<string>;
    number: FormControl<string>;
    type: FormControl<string>;
    pricePerNight: FormControl<number>;
  }>;

  constructor(private api: HotelService) {
    this.form = new FormGroup({
      name: new FormControl<string>('', { nonNullable: true }),
      number: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
      type: new FormControl<string>('Standard', { validators: [Validators.required], nonNullable: true }),
      pricePerNight: new FormControl<number>(0, { validators: [Validators.required, Validators.min(0)], nonNullable: true }),
    });
  }

  ngOnInit(): void { this.load(); }

  async load() {
    this.loading = true; this.error = '';
    try {
      const rooms = await firstValueFrom(this.api.getRooms());
      this.rooms = rooms ?? [];
      this.view = this.rooms.slice();
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to load rooms';
    } finally {
      this.loading = false;
    }
  }

  // UI helpers
  startCreate() {
    this.editingId = null;
    this.formOpen = true;
    this.form.reset({ name: '', number: '', type: 'Standard', pricePerNight: 0 });
  }

  cancelForm() {
    this.formOpen = false;
    this.editingId = null;
    this.form.reset({ name: '', number: '', type: 'Standard', pricePerNight: 0 });
  }

  filter() {
    const t = (this.q || '').toLowerCase().trim();
    if (!t) { this.view = this.rooms.slice(); return; }
    this.view = this.rooms.filter(r =>
      (r.name ?? '').toLowerCase().includes(t) ||
      r.number.toLowerCase().includes(t) ||
      r.type.toLowerCase().includes(t) ||
      String(r.pricePerNight).includes(t)
    );
  }

  askDelete(r: Room) { this.confirmDelete = r; }

  // CRUD
  async addRoom() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.error = '';
    try {
      const created = await firstValueFrom(this.api.addRoom(this.form.getRawValue()));
      if (created) {
        this.rooms.unshift(created);
        this.filter();
        this.cancelForm();
      }
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to add room';
    } finally { this.saving = false; }
  }

  edit(room: Room) {
    this.editingId = room.id;
    this.formOpen = true;
    this.form.setValue({
      name: room.name ?? '',
      number: room.number,
      type: room.type,
      pricePerNight: room.pricePerNight
    });
  }

  async saveEdit() {
    if (this.editingId == null || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.error = '';
    try {
      const updated = await firstValueFrom(this.api.updateRoom(this.editingId, this.form.getRawValue() as any));
      if (updated) {
        const idx = this.rooms.findIndex(r => r.id === this.editingId);
        if (idx >= 0) this.rooms[idx] = updated;
        this.filter();
        this.cancelForm();
      }
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to update room';
    } finally { this.saving = false; }
  }

  async remove(room: Room) {
    if (!room) return;
    this.saving = true; this.error = '';
    try {
      await firstValueFrom(this.api.deleteRoom(room.id));
      this.rooms = this.rooms.filter(r => r.id !== room.id);
      this.filter();
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to delete room';
    } finally {
      this.saving = false;
      this.confirmDelete = null;
    }
  }
}