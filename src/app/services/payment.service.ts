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
  expires_at: string;
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
  private apiUrl = 'https://harrypotterobamasonic10.com/api/';

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
  private API_KEY = 'CG-4bxNeYA1yhCsz7N2mZsd3LGN'; // Вставьте ваш API ключ здесь
  private priceCache: { [key: string]: { price: number, timestamp: number } } = {};
  private CACHE_DURATION = 60000; // 1 minute

  getPrice(coinId: string, originalPrice: number): Observable<number> {
    const cachedData = this.priceCache[coinId];
    if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_DURATION) {
      // alert(`Используем кэшированные данные для ${coinId}: ${cachedData.price}`);
      return of(cachedData.price);
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.API_KEY}`);

    return this.http.get<any>(`${this.APIURL}/simple/price?ids=${coinId},harrypotterobamasonic10in&vs_currencies=usd`, { headers })
      .pipe(
        map(response => {
          // alert('Ответ от API CoinGecko: ' + JSON.stringify(response));
          const coinPrice = response[coinId].usd;
          const harryPrice = response['harrypotterobamasonic10in'].usd;
          // alert(`Цена ${coinId} в USD: ${coinPrice}`);
          // alert('Цена Harry Potter токена в USD: ' + harryPrice);
          const exchangeRate = harryPrice / coinPrice;
          // alert('Рассчитанный курс обмена: ' + exchangeRate);
          this.priceCache[coinId] = { price: exchangeRate, timestamp: Date.now() };
          return exchangeRate;
        }),
        catchError(error => {
          // alert('Ошибка при получении цены: ' + error.message);
          return of(this.priceCache[coinId]?.price || 1);
        })
      );
  }

  private calculatePrice(exchangeRate: number, originalPrice: number): number {
    return originalPrice * exchangeRate;
  }

  public static get headers(): HttpHeaders {
    const telegramInitData = (window as any).Telegram?.WebApp?.initData || '';
    return new HttpHeaders()
      .set('X-Telegram-Init-Data', telegramInitData)
      .set('Content-Type', 'application/json');
  }
}