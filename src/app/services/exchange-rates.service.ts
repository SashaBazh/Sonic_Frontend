import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface ExchangeRates {
  harry_price_usd: number;
  ton_to_harry: number;
  usdt_to_harry: number;
  harry_historical: {
    "1d": HistoricalData;
    "7d": HistoricalData;
    "30d": HistoricalData;
    "90d": HistoricalData;
    "365d": HistoricalData;
    max: HistoricalData;
  };
  updated_at: string;
}

interface HistoricalData {
  prices: number[][];
  market_caps: number[][];
  total_volumes: number[][];
}

@Injectable({
  providedIn: 'root'
})
export class ExchangeRatesService {
  private apiUrl = 'https://sonic.testservisedomain.online/api/exchange/exchange_rates';

  constructor(private http: HttpClient, private authService: AuthService) { }

  getExchangeRates(): Observable<ExchangeRates> {
    return this.http.get<ExchangeRates>(this.apiUrl, { headers: AuthService.headers }).pipe(
      tap(response => {
        console.log('Exchange rates fetched successfully:', response);
      }),
      retry(3),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error fetching exchange rates:', error);
    return throwError(() => new Error('Failed to fetch exchange rates'));
  }
}