import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, retry, map } from 'rxjs/operators';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})

export class GameService {
  public static readonly API_URL = 'https://harrypotterobamasonic.com/api/';

  private lastGameTime: Date | null = null;

  private balanceSubject = new BehaviorSubject<number>(0);
  public balance$ = this.balanceSubject.asObservable();

  private scorePerTapSubject = new BehaviorSubject<number>(0);
  public scorePerTap$ = this.scorePerTapSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {

    const storedTime = localStorage.getItem('lastGameTime');
    if (storedTime) {
      this.lastGameTime = new Date(storedTime);
    }

  }

  setScorePerTap(score: number) {
    this.scorePerTapSubject.next(score);
  }

  getScorePerTap(): Observable<number> {
    return this.scorePerTap$;
  }

  // ДОБАЛЕНИЕ ОЧКОВ ЗА ИГРУ В БАЛАНС //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  submitGameResult(score: number, isWin: boolean): Observable<any> {
    const payload = {
      game_points: score,
      is_win: isWin
    };
    return this.http.post<any>(`${GameService.API_URL}home/add-game-points`, payload, { headers: GameService.headers }).pipe(
      tap(response => {
        console.log('Game result submitted successfully:', response);
        if (response.new_balance !== undefined) {
          this.updateBalance(response.new_balance);
        }
        this.lastGameTime = new Date();
        localStorage.setItem('lastGameTime', this.lastGameTime.toString());
      }),
      retry(3),
      catchError(this.handleError)
    );
  }

  updateBalance(balance: number) {
    this.balanceSubject.next(balance);
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error details:', error);
    return throwError(() => new Error(error.message));
  }

  public static get headers(): HttpHeaders {
    const telegramInitData = (window as any).Telegram?.WebApp?.initData || '';
    return new HttpHeaders()
      .set('X-Telegram-Init-Data', telegramInitData)
      .set('Content-Type', 'application/json');
  }
}