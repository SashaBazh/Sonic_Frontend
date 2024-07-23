// payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { NftService } from './nft.service';

interface CreatePaymentRequest {
  nft_id: number;
  currency: string;
}

interface CreatePaymentResponse {
  payment_id: number;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
}

interface CheckPaymentResponse {
  payment_status: string;
  actually_paid: number;
  pay_currency: string;
}

interface SimulatePaymentResponse {
  success: boolean;
  message: string;
}

interface CancelPaymentResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'https://harrypotterobamasonic.com/api/';

  constructor(private http: HttpClient) {}

  createPayment(nftId: number, currency: string): Observable<CreatePaymentResponse> {
    const request: CreatePaymentRequest = { nft_id: nftId, currency: currency };
    return this.http.post<CreatePaymentResponse>(`${this.apiUrl}payment/create`, request, { headers: PaymentService.headers });
  }

  checkPayment(paymentId: number): Observable<CheckPaymentResponse> {
    return this.http.get<CheckPaymentResponse>(`${this.apiUrl}payment/check/${paymentId}`, { headers: PaymentService.headers });
  }

  simulatePayment(paymentId: number): Observable<SimulatePaymentResponse> {
    return this.http.post<SimulatePaymentResponse>(`${this.apiUrl}payment/simulate-payment/${paymentId}`, {}, { headers: PaymentService.headers });
  }

  cancelPayment(paymentId: number): Observable<CancelPaymentResponse> {
    return this.http.delete<CancelPaymentResponse>(`${this.apiUrl}payment/cancel/${paymentId}`, { headers: PaymentService.headers });
  }

  getSupportedCurrencies(): Observable<string[]> {
    return this.http.get<{ currencies: string[] }>(`${this.apiUrl}payment/supported-currencies`, { headers: NftService.headers })
      .pipe(
        map(response => response.currencies)
      );
  }


  private APIURL = 'https://api.coingecko.com/api/v3';


  getPrice(coinId: string): Observable<number> {
    return this.http.get<any>(`${this.APIURL}/simple/price?ids=${coinId},harrypotterobamasonic10in&vs_currencies=usd`)
      .pipe(
        map(response => {
          const coinPrice = response[coinId].usd;
          const harryPrice = response['harrypotterobamasonic10in'].usd;
          return harryPrice / coinPrice;
        })
      );
  }


  public static get headers(): HttpHeaders {
    const telegramInitData = (window as any).Telegram?.WebApp?.initData || '';
    return new HttpHeaders()
      .set('X-Telegram-Init-Data', telegramInitData)
      .set('Content-Type', 'application/json');
  }
}