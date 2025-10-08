import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Room { id: number; number: string; type: string; pricePerNight: number; }
export interface Guest { id: number; fullName: string; email?: string; phone?: string; }
export interface Booking {
  id: number; roomId: number; guestId: number;
  checkIn: string; checkOut: string; totalPrice: number; status: string;
}

@Injectable({ providedIn: 'root' })
export class HotelService {
  private api = 'http://localhost:5276'; // backend

  constructor(private http: HttpClient) {}

  getRooms(): Observable<Room[]> { return this.http.get<Room[]>(`${this.api}/rooms`); }
  addRoom(room: Omit<Room,'id'>): Observable<Room> { return this.http.post<Room>(`${this.api}/rooms`, room); }

  getGuests(): Observable<Guest[]> { return this.http.get<Guest[]>(`${this.api}/guests`); }
  addGuest(guest: Omit<Guest,'id'>): Observable<Guest> { return this.http.post<Guest>(`${this.api}/guests`, guest); }

  getBookings(): Observable<Booking[]> { return this.http.get<Booking[]>(`${this.api}/bookings`); }
  addBooking(payload: {roomId:number; guestId:number; checkIn:string; checkOut:string}): Observable<Booking> {
    return this.http.post<Booking>(`${this.api}/bookings`, payload);
  }
}