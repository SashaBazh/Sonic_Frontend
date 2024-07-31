// payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
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

  constructor(private http: HttpClient) { }

  // ПОЛУЧЕНИЕ С БЭКА ИНФУ О СОЗДАНИИ ОПЛАТЫ  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  createPayment(nftId: number, currency: string): Observable<CreatePaymentResponse> {
    const request: CreatePaymentRequest = { nft_id: nftId, currency: currency };
    return this.http.post<CreatePaymentResponse>(`${this.apiUrl}payment/create`, request, { headers: PaymentService.headers });
  }

  // ПОЛУЧЕНИЕ С БЭКА ИНФУ О ПРОВЕРКЕ ОПЛАТЫ  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  checkPayment(paymentId: number): Observable<CheckPaymentResponse> {
    return this.http.get<CheckPaymentResponse>(`${this.apiUrl}payment/check/${paymentId}`, { headers: PaymentService.headers });
  }

  // ПОЛУЧЕНИЕ С БЭКА ИНФУ О СИМУЛЯЦИИ ОПЛАТЫ ВРОДЕ КАК БОЛЬШЕ НЕ ЮЗАЕТСЯ  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  simulatePayment(paymentId: number): Observable<SimulatePaymentResponse> {
    return this.http.post<SimulatePaymentResponse>(`${this.apiUrl}payment/simulate-payment/${paymentId}`, {}, { headers: PaymentService.headers });
  }

  // ПОЛУЧЕНИЕ С БЭКА ИНФУ ОБ ОТМЕНЕ ОПЛАТЫ  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  cancelPayment(paymentId: number): Observable<CancelPaymentResponse> {
    return this.http.delete<CancelPaymentResponse>(`${this.apiUrl}payment/cancel/${paymentId}`, { headers: PaymentService.headers });
  }

  // ПОЛУЧЕНИЕ С БЭКА ИНФУ О ДОСТУПНЫХ ВАЛЮТАХ ДЛЯ ОПЛАТЫ  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getSupportedCurrencies(): Observable<string[]> {
    return this.http.get<{ currencies: string[] }>(`${this.apiUrl}payment/supported-currencies`, { headers: NftService.headers })
      .pipe(
        map(response => response.currencies)
      );
  }

  private APIURL = 'https://api.coingecko.com/api/v3';

  // ПОЛУЧЕНИЕ С COINGECO ИНФУ О ТЕКУЩЕЙ ЦЕНЕ ТОКЕНА  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private priceCache: { [key: string]: { price: number, timestamp: number } } = {};
  private CACHE_DURATION = 60000; // 1 минута

  getPrice(coinId: string): Observable<number> {
    const cachedData = this.priceCache[coinId];
    if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_DURATION) {
      return of(cachedData.price);
    }

    return this.http.get<any>(`${this.APIURL}/simple/price?ids=${coinId},harrypotterobamasonic10in&vs_currencies=usd`)
      .pipe(
        map(response => {
          const coinPrice = response[coinId].usd;
          const harryPrice = response['harrypotterobamasonic10in'].usd;
          const price = harryPrice / coinPrice;
          this.priceCache[coinId] = { price, timestamp: Date.now() };
          return price;
        }),
        catchError(error => {
          console.error('Error fetching price:', error);
          return of(this.priceCache[coinId]?.price || 30000);
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