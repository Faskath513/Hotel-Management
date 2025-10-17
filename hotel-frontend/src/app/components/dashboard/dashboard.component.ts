import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HotelService, Booking, Room, Revenue } from '../../services/hotel.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  loading = false;
  error = '';

  today = new Date().toISOString().slice(0, 10);
  kpis: { availableCount: number; occupiedCount: number; revenueToday: number; upcomingCheckouts: number } = {
    availableCount: 0,
    occupiedCount: 0,
    revenueToday: 0,
    upcomingCheckouts: 0
  };

  lists: { availableRooms: Room[]; occupiedBookings: Booking[]; upcoming: Booking[] } = {
    availableRooms: [],
    occupiedBookings: [],
    upcoming: []
  };

  rangeForm = new FormGroup({
    from: new FormControl<string>(this.today, { nonNullable: true }),
    to: new FormControl<string>(this.today, { nonNullable: true })
  });

  constructor(private api: HotelService) {}

  ngOnInit(): void {
    this.refresh();
  }

  async refresh() {
    this.loading = true; this.error = '';
    const { from, to } = this.rangeForm.getRawValue();
    try {
      const [available, occupied, upcoming, revenue] = await Promise.all([
        this.api.getAvailableRooms(from, to).toPromise(),
        this.api.getOccupiedRooms(to).toPromise(),
        this.api.getUpcomingCheckouts(to).toPromise(),
        this.api.getDailyRevenue(to).toPromise()
      ]);
      this.lists.availableRooms = available ?? [];
      this.lists.occupiedBookings = occupied ?? [];
      this.lists.upcoming = upcoming ?? [];
      this.kpis.availableCount = this.lists.availableRooms.length;
      this.kpis.occupiedCount = this.lists.occupiedBookings.length;
      this.kpis.upcomingCheckouts = this.lists.upcoming.length;
      this.kpis.revenueToday = (revenue as Revenue | undefined)?.revenue ?? 0;
    } catch (e: any) {
      this.error = e?.error ?? e?.message ?? 'Failed to load dashboard';
    } finally {
      this.loading = false;
    }
  }
}


