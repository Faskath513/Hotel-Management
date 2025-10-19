import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Room { id: number; number: string; type: string; pricePerNight: number; name?: string; }
export interface Guest { id: number; fullName: string; email?: string; phone?: string; }
export interface Booking {
  id: number; roomId: number; guestId: number;
  checkIn: string; checkOut: string; totalPrice: number; status: string;
}
export interface Revenue { date: string; revenue: number; }

export interface Payment {
  id: number;
  bookingId: number;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  checkNumber?: string;
  paymentDate: string;
  status: string;
  notes?: string;
}

export interface PaymentDto {
  bookingId: number;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  checkNumber?: string;
  notes?: string;
}

export interface ReceiptDto {
  paymentId: number;
  bookingId: number;
  guestName: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  checkNumber?: string;
  paymentDate: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class HotelService {
  private api = 'http://localhost:5276'; // backend
  private token: string | null = null;
  private username: string | null = null;

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    if (stored) this.token = stored;
    if (user) this.username = user;
  }

  setToken(token: string | null, username?: string | null) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token); else localStorage.removeItem('auth_token');
    if (username) { this.username = username; localStorage.setItem('auth_user', username); }
  }
  isLoggedIn() { return !!this.token; }
  currentUsername() { return this.username; }
  private authHeaders(): { headers?: HttpHeaders } {
    if (!this.token) return {};
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this.token}` }) };
  }

  getRooms(): Observable<Room[]> { return this.http.get<Room[]>(`${this.api}/rooms`, this.authHeaders()); }
  addRoom(room: Omit<Room,'id'>): Observable<Room> { return this.http.post<Room>(`${this.api}/rooms`, room, this.authHeaders()); }
  updateRoom(id: number, room: Omit<Room,'id'>): Observable<Room> { return this.http.put<Room>(`${this.api}/rooms/${id}`, room, this.authHeaders()); }
  deleteRoom(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/rooms/${id}`, this.authHeaders()); }

  getGuests(): Observable<Guest[]> { return this.http.get<Guest[]>(`${this.api}/guests`, this.authHeaders()); }
  addGuest(guest: Omit<Guest,'id'>): Observable<Guest> { return this.http.post<Guest>(`${this.api}/guests`, guest, this.authHeaders()); }
  updateGuest(id: number, guest: Omit<Guest,'id'>): Observable<Guest> { return this.http.put<Guest>(`${this.api}/guests/${id}`, guest, this.authHeaders()); }
  deleteGuest(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/guests/${id}`, this.authHeaders()); }

  getBookings(): Observable<Booking[]> { return this.http.get<Booking[]>(`${this.api}/bookings`, this.authHeaders()); }
  addBooking(payload: {roomId:number; guestId:number; checkIn:string; checkOut:string}): Observable<Booking> {
    return this.http.post<Booking>(`${this.api}/bookings`, payload, this.authHeaders());
  }
  updateBooking(id:number, payload: Partial<Booking>): Observable<Booking> {
    return this.http.put<Booking>(`${this.api}/bookings/${id}`, payload, this.authHeaders());
  }
  deleteBooking(id:number): Observable<void> {
    return this.http.delete<void>(`${this.api}/bookings/${id}`, this.authHeaders());
  }

  checkIn(bookingId: number): Observable<Booking> {
    return this.http.post<Booking>(`${this.api}/bookings/${bookingId}/checkin`, {}, this.authHeaders());
  }

  checkOut(bookingId: number): Observable<Booking> {
    return this.http.post<Booking>(`${this.api}/bookings/${bookingId}/checkout`, {}, this.authHeaders());
  }

  getAvailableRooms(from?: string, to?: string) {
    const params: any = {};
    if (from) params.from = from; if (to) params.to = to;
    return this.http.get<Room[]>(`${this.api}/reports/available-rooms`, { params, ...this.authHeaders() });
  }

  getOccupiedRooms(on?: string) {
    const params: any = {}; if (on) params.on = on;
    return this.http.get<Booking[]>(`${this.api}/reports/occupied-rooms`, { params, ...this.authHeaders() });
  }

  getUpcomingCheckouts(until?: string) {
    const params: any = {}; if (until) params.until = until;
    return this.http.get<Booking[]>(`${this.api}/reports/upcoming-checkouts`, { params, ...this.authHeaders() });
  }

  getDailyRevenue(day?: string) {
    const params: any = {}; if (day) params.day = day;
    return this.http.get<Revenue>(`${this.api}/reports/daily-revenue`, { params, ...this.authHeaders() });
  }

  login(username: string, password: string) {
    return this.http.post<{token:string, username:string}>(`${this.api}/auth/login`, { username, password });
  }

  signup(username: string, password: string, confirmPassword: string) {
    return this.http.post(`${this.api}/auth/signup`, { username, password, confirmPassword });
  }

  logout() {
    this.setToken(null, null);
    return this.http.post(`${this.api}/auth/logout`, {}, this.authHeaders());
  }

  // Payment methods
  getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.api}/payments`, this.authHeaders());
  }

  getPayment(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.api}/payments/${id}`, this.authHeaders());
  }

  createPayment(payment: PaymentDto): Observable<Payment> {
    return this.http.post<Payment>(`${this.api}/payments`, payment, this.authHeaders());
  }

  getReceipt(paymentId: number): Observable<ReceiptDto> {
    return this.http.get<ReceiptDto>(`${this.api}/payments/${paymentId}/receipt`, this.authHeaders());
  }

  getPaymentsByBooking(bookingId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.api}/bookings/${bookingId}/payments`, this.authHeaders());
  }

  updatePaymentStatus(id: number, status: string): Observable<Payment> {
    return this.http.put<Payment>(`${this.api}/payments/${id}/status`, status, this.authHeaders());
  }

  deletePayment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/payments/${id}`, this.authHeaders());
  }
}