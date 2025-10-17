import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { HotelService, Room, Booking, Revenue } from '../../services/hotel.service';
import { distinctUntilChanged, Subscription } from 'rxjs';

function todayLocalISO(): string {
  const d = new Date();
  const tzSafe = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tzSafe.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgForOf],
  templateUrl: './reports.component.html'
})
export class ReportsComponent implements OnInit, OnDestroy {
  available: Room[] = [];
  occupied: Booking[] = [];
  upcoming: Booking[] = [];
  revenue?: Revenue;
  error = '';

  // loading flags for skeletons
  loadingAvailable = false;
  loadingOccupied = false;
  loadingUpcoming = false;
  loadingRevenue = false;

  // Strongly typed, non-nullable control
  filter!: FormGroup<{ date: FormControl<string> }>;

  private sub?: Subscription;

  constructor(private api: HotelService) {
    this.filter = new FormGroup({
      date: new FormControl<string>(todayLocalISO(), { nonNullable: true })
    });
  }

  ngOnInit(): void {
    this.refresh();
    this.sub = this.filter.controls.date.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  refresh() {
    this.error = '';
    const { date: day } = this.filter.getRawValue();

    // Available
    this.loadingAvailable = true;
    this.api.getAvailableRooms(day, day).subscribe({
      next: v => (this.available = v),
      error: e => (this.error = e?.error ?? e?.message ?? 'Failed to load available rooms'),
      complete: () => (this.loadingAvailable = false)
    });

    // Occupied
    this.loadingOccupied = true;
    this.api.getOccupiedRooms(day).subscribe({
      next: v => (this.occupied = v),
      error: e => (this.error = e?.error ?? e?.message ?? 'Failed to load occupied rooms'),
      complete: () => (this.loadingOccupied = false)
    });

    // Upcoming
    this.loadingUpcoming = true;
    this.api.getUpcomingCheckouts(day).subscribe({
      next: v => (this.upcoming = v),
      error: e => (this.error = e?.error ?? e?.message ?? 'Failed to load upcoming checkouts'),
      complete: () => (this.loadingUpcoming = false)
    });

    // Revenue
    this.loadingRevenue = true;
    this.api.getDailyRevenue(day).subscribe({
      next: v => (this.revenue = v),
      error: e => (this.error = e?.error ?? e?.message ?? 'Failed to load revenue'),
      complete: () => (this.loadingRevenue = false)
    });
  }

  // quick date nav
  prevDay() { this.bumpDay(-1); }
  nextDay() { this.bumpDay(1); }
  setToday() { this.filter.controls.date.setValue(todayLocalISO()); }

  private bumpDay(delta: number) {
    const cur = this.filter.controls.date.value;
    const d = new Date(cur + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    const tzSafe = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    this.filter.controls.date.setValue(tzSafe.toISOString().slice(0, 10));
  }

  // trackBy for snappy list rendering
  trackRoom = (_: number, r: Room) => r.id;
  trackBooking = (_: number, b: Booking) => b.id;
}