import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HotelService, Payment, PaymentDto, ReceiptDto, Booking } from '../../services/hotel.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payments.component.html'
})
export class PaymentsComponent implements OnInit {
  loading = false;
  error = '';
  payments: Payment[] = [];
  bookings: Booking[] = [];
  selectedBooking: Booking | null = null;
  showPaymentForm = false;
  showReceipt = false;
  currentReceipt: ReceiptDto | null = null;

  paymentForm = new FormGroup({
    bookingId: new FormControl<number>(0, { validators: [Validators.required, Validators.min(1)], nonNullable: true }),
    amount: new FormControl<number>(0, { validators: [Validators.required, Validators.min(0.01)], nonNullable: true }),
    paymentMethod: new FormControl<string>('Cash', { validators: [Validators.required], nonNullable: true }),
    transactionId: new FormControl<string>('', { nonNullable: true }),
    checkNumber: new FormControl<string>('', { nonNullable: true }),
    notes: new FormControl<string>('', { nonNullable: true })
  });

  constructor(private api: HotelService) {}

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.error = '';
    try {
      const [payments, bookings] = await Promise.all([
        this.api.getPayments().toPromise(),
        this.api.getBookings().toPromise()
      ]);
      this.payments = payments ?? [];
      this.bookings = bookings ?? [];
    } catch (e: any) {
      this.error = e?.error?.message ?? e?.message ?? 'Failed to load data';
    } finally {
      this.loading = false;
    }
  }

  onBookingChange() {
    const bookingId = this.paymentForm.get('bookingId')?.value;
    this.selectedBooking = this.bookings.find(b => b.id === bookingId) ?? null;
    
    if (this.selectedBooking) {
      this.paymentForm.patchValue({
        amount: this.selectedBooking.totalPrice
      });
    }
  }

  onPaymentMethodChange() {
    const method = this.paymentForm.get('paymentMethod')?.value;
    const transactionId = this.paymentForm.get('transactionId');
    const checkNumber = this.paymentForm.get('checkNumber');
    
    if (method === 'Card') {
      transactionId?.setValidators([Validators.required]);
      checkNumber?.clearValidators();
    } else if (method === 'Check') {
      checkNumber?.setValidators([Validators.required]);
      transactionId?.clearValidators();
    } else {
      transactionId?.clearValidators();
      checkNumber?.clearValidators();
    }
    
    transactionId?.updateValueAndValidity();
    checkNumber?.updateValueAndValidity();
  }

  async processPayment() {
    if (this.paymentForm.invalid) return;
    
    this.loading = true;
    this.error = '';
    
    try {
      const paymentData: PaymentDto = this.paymentForm.getRawValue();
      const payment = await this.api.createPayment(paymentData).toPromise();
      
      if (payment) {
        this.payments.unshift(payment);
        this.showPaymentForm = false;
        this.paymentForm.reset();
        this.selectedBooking = null;
        
        // Generate receipt
        await this.generateReceipt(payment.id);
      }
    } catch (e: any) {
      this.error = e?.error?.message ?? e?.message ?? 'Payment failed';
    } finally {
      this.loading = false;
    }
  }

  async generateReceipt(paymentId: number) {
    try {
      const receipt = await this.api.getReceipt(paymentId).toPromise();
      if (receipt) {
        this.currentReceipt = receipt;
        this.showReceipt = true;
      }
    } catch (e: any) {
      this.error = e?.error?.message ?? e?.message ?? 'Failed to generate receipt';
    }
  }

  printReceipt() {
    if (this.currentReceipt) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(this.getReceiptHTML());
        printWindow.document.close();
        printWindow.print();
      }
    }
  }

  private getReceiptHTML(): string {
    if (!this.currentReceipt) return '';
    
    const receipt = this.currentReceipt;
    const checkInDate = new Date(receipt.checkIn).toLocaleDateString();
    const checkOutDate = new Date(receipt.checkOut).toLocaleDateString();
    const paymentDate = new Date(receipt.paymentDate).toLocaleString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .details { margin: 20px 0; }
          .row { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 10px; }
          .footer { margin-top: 30px; text-align: center; font-size: 0.9em; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Hotel Management System</h1>
          <h2>Payment Receipt</h2>
        </div>
        
        <div class="details">
          <div class="row">
            <span>Receipt #:</span>
            <span>${receipt.paymentId}</span>
          </div>
          <div class="row">
            <span>Booking #:</span>
            <span>${receipt.bookingId}</span>
          </div>
          <div class="row">
            <span>Guest Name:</span>
            <span>${receipt.guestName}</span>
          </div>
          <div class="row">
            <span>Room:</span>
            <span>${receipt.roomNumber} (${receipt.roomType})</span>
          </div>
          <div class="row">
            <span>Check-in:</span>
            <span>${checkInDate}</span>
          </div>
          <div class="row">
            <span>Check-out:</span>
            <span>${checkOutDate}</span>
          </div>
          <div class="row">
            <span>Payment Method:</span>
            <span>${receipt.paymentMethod}</span>
          </div>
          ${receipt.transactionId ? `
          <div class="row">
            <span>Transaction ID:</span>
            <span>${receipt.transactionId}</span>
          </div>
          ` : ''}
          ${receipt.checkNumber ? `
          <div class="row">
            <span>Check Number:</span>
            <span>${receipt.checkNumber}</span>
          </div>
          ` : ''}
          <div class="row">
            <span>Payment Date:</span>
            <span>${paymentDate}</span>
          </div>
          <div class="row total">
            <span>Amount Paid:</span>
            <span>$${receipt.amount.toFixed(2)}</span>
          </div>
          ${receipt.notes ? `
          <div style="margin-top: 15px;">
            <strong>Notes:</strong><br>
            ${receipt.notes}
          </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>Thank you for your payment!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  cancelPayment() {
    this.showPaymentForm = false;
    this.paymentForm.reset();
    this.selectedBooking = null;
  }

  closeReceipt() {
    this.showReceipt = false;
    this.currentReceipt = null;
  }

  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'Cash': return '💵';
      case 'Card': return '💳';
      case 'Check': return '📝';
      default: return '💰';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Failed': return 'text-red-600 bg-red-100';
      case 'Refunded': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
}

