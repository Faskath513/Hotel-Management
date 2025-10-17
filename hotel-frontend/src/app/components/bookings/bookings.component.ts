import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { FormsModule } from '@angular/forms'; // for [(ngModel)] search
import { firstValueFrom } from 'rxjs';
import { HotelService, Room, Guest, Booking } from '../../services/hotel.service';

type BookingView = Booking & { room?: Room; guest?: Guest };

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgIf, NgForOf],
  templateUrl: './bookings.component.html'
})
export class BookingsComponent implements OnInit {
  // data sets
  rooms: Room[] = [];
  guests: Guest[] = [];
  bookings: BookingView[] = []; // hydrated with room/guest
  view: BookingView[] = [];     // filtered/sorted view

  // lookup maps for fast hydration
  private roomMap = new Map<number, Room>();
  private guestMap = new Map<number, Guest>();

  // ui state
  q = '';
  formOpen = false;
  editingId: number | null = null;
  openId: number | null = null;             // optional: expanded row details
  confirmDelete: BookingView | null = null; // for modal confirm

  // flags/errors
  error = '';
  saving = false;
  loading = true;

  // form
  form!: FormGroup<{
    roomId: FormControl<number | null>;
    guestId: FormControl<number | null>;
    checkIn: FormControl<string>;
    checkOut: FormControl<string>;
  }>;

  constructor(private api: HotelService) {
    this.form = new FormGroup({
      roomId:   new FormControl<number | null>(null, { validators: [Validators.required] }),
      guestId:  new FormControl<number | null>(null, { validators: [Validators.required] }),
      checkIn:  new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
      checkOut: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    });
  }

  ngOnInit(): void { this.refresh(); }

  // ---------- load + hydrate ----------
  async refresh() {
    this.error = ''; this.loading = true;
    try {
      const [rooms, guests, bookings] = await Promise.all([
        firstValueFrom(this.api.getRooms()),
        firstValueFrom(this.api.getGuests()),
        firstValueFrom(this.api.getBookings())
      ]);

      this.rooms = rooms ?? [];
      this.guests = guests ?? [];
      this.rebuildMaps();

      // hydrate bookings with room/guest refs
      this.bookings = (bookings ?? []).map(b => this.hydrate(b));
      this.view = this.bookings.slice();

      // sensible defaults for form selects
      if (!this.form.value.roomId && this.rooms.length)  this.form.patchValue({ roomId: this.rooms[0].id });
      if (!this.form.value.guestId && this.guests.length) this.form.patchValue({ guestId: this.guests[0].id });
    } catch (err: any) {
      this.error = err?.error ?? err?.message ?? 'Failed to load data';
    } finally {
      this.loading = false;
    }
  }

  private rebuildMaps() {
    this.roomMap = new Map(this.rooms.map(r => [r.id, r]));
    this.guestMap = new Map(this.guests.map(g => [g.id, g]));
  }

  private hydrate(b: Booking): BookingView {
    return {
      ...b,
      room: this.roomMap.get(b.roomId),
      guest: this.guestMap.get(b.guestId),
    };
  }

  // ---------- UI helpers ----------
  startCreate() {
    this.editingId = null;
    this.formOpen = true;
    this.form.reset({
      roomId: this.rooms[0]?.id ?? null,
      guestId: this.guests[0]?.id ?? null,
      checkIn: '',
      checkOut: ''
    });
  }

  cancelForm() {
    this.formOpen = false;
    this.editingId = null;
    this.form.patchValue({ checkIn: '', checkOut: '' });
  }

  filter() {
    const t = (this.q || '').toLowerCase().trim();
    if (!t) { this.view = this.bookings.slice(); return; }
    this.view = this.bookings.filter(b =>
      (b.room?.number?.toLowerCase?.().includes(t) ?? false) ||
      (b.roomId && String(b.roomId).includes(t)) ||
      (b.guest?.fullName?.toLowerCase?.().includes(t) ?? false) ||
      (b.guestId && String(b.guestId).includes(t))
    );
  }

  askDelete(b: BookingView) { this.confirmDelete = b; }

  // ---------- CRUD ----------
  async addBooking() {
    if (this.form.invalid) return;
    const { roomId, guestId, checkIn, checkOut } = this.form.getRawValue();
    this.saving = true; this.error = '';
    try {
      const created = await firstValueFrom(
        this.api.addBooking({
          roomId: Number(roomId), guestId: Number(guestId),
          checkIn: String(checkIn), checkOut: String(checkOut)
        })
      );
      if (created) {
        const hydrated = this.hydrate(created);
        this.bookings.unshift(hydrated);
        this.filter();
        this.cancelForm();
      }
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to add booking';
    } finally {
      this.saving = false;
    }
  }

  edit(b: BookingView) {
    this.editingId = b.id;
    this.formOpen = true;
    this.openId = b.id; // optional expand details
    this.form.patchValue({
      roomId:  b.roomId,
      guestId: b.guestId,
      checkIn: String(b.checkIn).slice(0,10),
      checkOut: String(b.checkOut).slice(0,10)
    });
  }

  async saveEdit() {
    if (this.editingId == null || this.form.invalid) return;
    this.saving = true; this.error = '';
    try {
      const payload: Partial<Booking> = {
        roomId:  Number(this.form.value.roomId!),
        guestId: Number(this.form.value.guestId!),
        checkIn: String(this.form.value.checkIn!),
        checkOut: String(this.form.value.checkOut!)
      };
      const updated = await firstValueFrom(this.api.updateBooking(this.editingId, payload));
      if (updated) {
        const idx = this.bookings.findIndex(x => x.id === this.editingId);
        if (idx >= 0) {
          this.bookings[idx] = this.hydrate(updated);
        }
        this.filter();
        this.cancelForm();
      }
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to update booking';
    } finally {
      this.saving = false;
    }
  }

  async remove(b: BookingView) {
    if (!b) return;
    this.saving = true; this.error = '';
    try {
      await firstValueFrom(this.api.deleteBooking(b.id));
      this.bookings = this.bookings.filter(x => x.id !== b.id);
      this.filter();
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to delete booking';
    } finally {
      this.saving = false;
      this.confirmDelete = null;
    }
  }

  async doCheckIn(b: BookingView) {
    this.saving = true; this.error = '';
    try {
      const updated = await firstValueFrom(this.api.checkIn(b.id));
      if (updated) {
        const idx = this.bookings.findIndex(x => x.id === b.id);
        if (idx >= 0) this.bookings[idx] = this.hydrate(updated);
        this.filter();
      }
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to check in';
    } finally {
      this.saving = false;
    }
  }

  async doCheckOut(b: BookingView) {
    this.saving = true; this.error = '';
    try {
      const updated = await firstValueFrom(this.api.checkOut(b.id));
      if (updated) {
        const idx = this.bookings.findIndex(x => x.id === b.id);
        if (idx >= 0) this.bookings[idx] = this.hydrate(updated);
        this.filter();
      }
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to check out';
    } finally {
      this.saving = false;
    }
  }
}