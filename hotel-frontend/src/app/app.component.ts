import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HotelService, Room, Guest, Booking } from './services/hotel.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  rooms: Room[] = [];
  guests: Guest[] = [];
  bookings: Booking[] = [];
  error = '';
  saving = false;

  roomForm: any;
  guestForm: any;
  bookingForm: any;

  constructor(private api: HotelService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.roomForm = this.fb.group({
      number: ['', [Validators.required]],
      type: ['Standard', [Validators.required]],
      pricePerNight: [0, [Validators.required, Validators.min(0)]],
    });

    this.guestForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: [''],
      phone: ['']
    });

    this.bookingForm = this.fb.group({
      roomId: [null as number | null, [Validators.required]],
      guestId: [null as number | null, [Validators.required]],
      checkIn: ['', [Validators.required]],
      checkOut: ['', [Validators.required]]
    });

    this.refresh();
  }

  refresh() {
    this.error = '';
    forkJoin({
      rooms: this.api.getRooms(),
      guests: this.api.getGuests(),
      bookings: this.api.getBookings()
    }).subscribe({
      next: ({ rooms, guests, bookings }) => {
        this.rooms = rooms;
        this.guests = guests;
        this.bookings = bookings;

        // Preselect first room/guest for booking form
        if (!this.bookingForm.value.roomId && rooms.length) {
          this.bookingForm.patchValue({ roomId: rooms[0].id });
        }
        if (!this.bookingForm.value.guestId && guests.length) {
          this.bookingForm.patchValue({ guestId: guests[0].id });
        }
      },
      error: (err) => this.error = err?.error ?? err?.message ?? 'Failed to load data'
    });
  }

  async addRoom() {
    if (this.roomForm.invalid) return;
    this.saving = true;
    this.error = '';
    try {
      const created = await this.api.addRoom(this.roomForm.getRawValue() as any).toPromise();
      if (created) this.rooms.push(created);
      this.roomForm.reset({ number: '', type: 'Standard', pricePerNight: 0 });
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to add room';
    } finally { this.saving = false; }
  }

  async addGuest() {
    if (this.guestForm.invalid) return;
    this.saving = true;
    this.error = '';
    try {
      const created = await this.api.addGuest(this.guestForm.getRawValue() as any).toPromise();
      if (created) this.guests.push(created);
      this.guestForm.reset({ fullName: '', email: '', phone: '' });
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to add guest';
    } finally { this.saving = false; }
  }

  async addBooking() {
    if (this.bookingForm.invalid) return;
    const { roomId, guestId, checkIn, checkOut } = this.bookingForm.getRawValue();
    this.saving = true;
    this.error = '';
    try {
      const created = await this.api.addBooking({
        roomId: Number(roomId),
        guestId: Number(guestId),
        checkIn: String(checkIn),
        checkOut: String(checkOut)
      }).toPromise();
      if (created) this.bookings.unshift(created);
      this.bookingForm.patchValue({ checkIn: '', checkOut: '' });
    } catch (e: any) {
      // Will show conflict message from API when double-booked (409)
      this.error = e?.error ?? e?.message ?? 'Failed to add booking';
    } finally { this.saving = false; }
  }
}