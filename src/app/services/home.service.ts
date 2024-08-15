import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, interval, forkJoin } from 'rxjs';
import { catchError, tap, retry, map, switchMap } from 'rxjs/operators';
import { API_URL } from '../constants';

interface LeaderboardEntry {
  user_id: string;
  rank: number;
  name: string;
  score: number;
  telegram_id?: number;
  sonic_balance?: number;
  referral_count?: number;
  spent_on_nft?: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

interface ClickResponse {
  clicks: number;
}

interface ClickBatch {
  clicks: number;
  timestamp: number;
  current_client_balance: number;
}

interface ClickResponse {
  validated_clicks: number;
  new_balance: number;
  clicks_left: number;
  max_daily_clicks: number;
  next_reset: string;
}

interface UserResponse {
  user_id: number;
  telegram_id: number;
  sonic_balance: number;
  referral_balance: number;
  totalreferralBalance: number;
}

export interface AutoClickerStatus {
  is_active: boolean;
  is_available: boolean;
}

interface NftResponse {
  nft_id: number;
  name: string;
  max_taps: number;
  score_per_tap: number;
  price: number;
  image_uri?: string;
  in_game_points_1_level: number;
  real_money_1_level: number;
  real_money_2_level: number;
  real_money_3_level: number;
  game_max_score: number;
}

interface UserNftResponse {
  nft: NftResponse;
  is_active: boolean;
}

interface EnergyResponse {
  left_energy: number;
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  // public static readonly API_URL = 'https://sonic.testservisedomain.online/api/';

  private lastGameTime: Date | null = null;

  private referralLinkSubject = new BehaviorSubject<string>('');
  public referralLink$ = this.referralLinkSubject.asObservable();

  private balanceSubject = new BehaviorSubject<number>(0);
  public balance$ = this.balanceSubject.asObservable();

  private energySubject = new BehaviorSubject<number>(0);
  public energy$ = this.energySubject.asObservable();

  private maxTapsSubject = new BehaviorSubject<number>(0);
  maxTaps$ = this.maxTapsSubject.asObservable();

  autoClickerEnabled: boolean | undefined;

  constructor(private http: HttpClient) {

    const storedTime = localStorage.getItem('lastGameTime');
    if (storedTime) {
      this.lastGameTime = new Date(storedTime);
    }
  }

  canPlayGame(): boolean {
    if (!this.lastGameTime) {
      return true;
    }
    const now = new Date();
    const timeDiff = now.getTime() - this.lastGameTime.getTime();
    return timeDiff >= 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
  }

  // ПОЛУЧЕНИЕ С БЭКА СТАТУСА О ВОЗМОЖНОСТИ ИГРАТЬ В ИГРУ //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  playGame(): Observable<any> {
    return this.http.get<any>(`${API_URL}home/game-status`, { headers: HomeService.headers }).pipe(
      tap(response => {
        console.log('Game status:', response);
        if (response.can_game) {
          this.lastGameTime = new Date();
          localStorage.setItem('lastGameTime', this.lastGameTime.toString());
        }
      }),
      retry(3),
      catchError(this.handleError)
    );
  }

  initializeUserData(): Observable<void> {
    return forkJoin({
      energy: this.getLeftEnergy(),
      nft: this.getMostExpensiveNft()
    }).pipe(
      tap(({ energy, nft }) => {
        this.updateEnergy(energy);
        if (nft.nft) {
          this.updateMaxTaps(nft.nft.max_taps);
        }
      }),
      map(() => void 0)
    );
  }

  updateMaxTaps(maxTaps: number) {
    this.maxTapsSubject.next(maxTaps);
  }

  // ДОБАВЛЕНИЕ СОБРАННЫХ ОЧКОВ ЗА ИГРУ В БАЛАНС //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  submitGameResult(score: number, isWin: boolean): Observable<any> {
    const payload = {
      game_points: score,
      is_win: isWin
    };
    return this.http.post<any>(`${API_URL}home/add-game-points`, payload, { headers: HomeService.headers }).pipe(
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

  // ПОЛУЧЕНИЕ С БЭКА ТЕКУЩЕЙ NFT ЮЗЕРА //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getMostExpensiveNft(): Observable<UserNftResponse> {
    return this.http.get<UserNftResponse>(`${API_URL}nft/my`, { headers: HomeService.headers })
      .pipe(
        tap(response => {
          if (response.nft && response.is_active) {
            this.updateActiveSkin(response.nft.nft_id);
          }
        }),
        retry(3),
        catchError(this.handleError)
      );
  }

  // ПОЛУЧЕНИЕ С БЭКА ИНФУ О ДОСТУПНЫХ NFT ДЛЯ ИЗЕРА ЧТО БЫ ВЫШЕ ИСКАТЬ ИЗ НИК САМУЮ ДОРОГУЮ ТО ЕСТЬ ТЕКУЩУЮ //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getAllUserNfts(): Observable<UserNftResponse> {
    return this.http.get<UserNftResponse>(`${API_URL}nft/my-all`, { headers: HomeService.headers })
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  // ЭТА ХУЙНЯ ВРОДЕ КАК ВООБЩЕ НЕ НУЖНА НО ЮЗАЕТСЯ //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private updateActiveSkin(nftId: number) {
    // Implement the logic to update the active skin
    // For example, you can emit an event or update a BehaviorSubject
  }

  // ПОЛУЧЕНИЕ С БЭКА БАЛАНС ЮЗЕРА //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getUserBalance(): Observable<number> {
    return this.http.get<UserResponse>(`${API_URL}user/balances`, { headers: HomeService.headers })
      .pipe(
        map(response => response.sonic_balance),
        tap(balance => this.updateBalance(balance)),
        retry(3),
        catchError(this.handleError)
      );
  }

  updateBalance(balance: number) {
    this.balanceSubject.next(balance);
  }

  // ПОЛУЧЕНИЕ С БЭКА ОСТАВШУЮСЯ ЕНЕРГИЮ //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getLeftEnergy(): Observable<number> {
    return this.http.get<EnergyResponse>(`${API_URL}home/left-energy`, { headers: HomeService.headers })
      .pipe(
        map(response => response.left_energy),
        tap(energy => this.updateEnergy(energy)),
        retry(3),
        catchError(this.handleError)
      );
  }

  updateEnergy(energy: number) {
    this.energySubject.next(energy);
    console.log('Энергия обновлена:', energy);
  }

  // РЕГИСТРАЦИЯ КЛИКА //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  click(): Observable<number> {
    return this.http.post<ClickResponse>(`${API_URL}home/click`, {}, { headers: HomeService.headers }).pipe(
      map(response => response.clicks),
      tap(clicks => {
        // alert(`Click registered successfully: ${clicks}`);
        this.updateBalance(clicks);
      }),
      retry(3),
      catchError(error => {
        // alert(`Error registering click: ${JSON.stringify(error)}`);
        return this.handleError(error);
      })
    );
  }
  
  sendClickBatch(clickBatch: ClickBatch): Observable<ClickResponse> {
    return this.http.post<ClickResponse>(`${API_URL}home/click`, clickBatch, { headers: HomeService.headers }).pipe(
      tap(response => {
      }),
      catchError(error => {
        return this.handleError(error);
      })
    );
  }

  // ПОЛУЧЕНИЕ С БЭКА ИНФУ О ЛИДЕРБОРДАХ //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getLeaderboardSonics(): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${API_URL}home/leader-board-sonics`, { headers: HomeService.headers })
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  getLeaderboardReferrals(): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${API_URL}home/leader-board-referrals`, { headers: HomeService.headers })
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  getLeaderboardSpentNFT(): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${API_URL}home/leader-board-spent-nft`, { headers: HomeService.headers })
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  // ПОЛУЧЕНИЕ С БЭКА РЕФКУ ЮЗЕРА //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getReferralLink(): Observable<string> {
    return this.http.get<any>(`${API_URL}home/referral-link`, { headers: HomeService.headers }).pipe(
      map(response => response.referral_link),
      tap(link => {
        console.log('Referral link received:', link);
        this.referralLinkSubject.next(link);
      }),
      retry(3),
      catchError(this.handleError)
    );
  }

  generateQRCode(link: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(link)}`;
  }

  // ХУЙНЯ ДЛЯ АВТОКЛИКЕРА //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  toggleAutoClicker(): Observable<any> {
    return this.http.post(`${API_URL}home/auto-clicker/activate`, {}, { headers: HomeService.headers }).pipe(
      catchError(error => {
        if (error.status === 403) {
          return throwError(() => new Error("y"));
        } else {
          return throwError(() => error);
        }
      })
    );
  }

  getAutoClickerStatus(): Observable<AutoClickerStatus> {
    return this.http.get<AutoClickerStatus>(`${API_URL}home/auto-clicker/status`, { headers: HomeService.headers }).pipe(
      catchError(this.handleError)
    );
  }

  startAutoClickerProcess(): Observable<any> {
    return interval(60000).pipe(
      switchMap(() => this.processAutoClicker())
    );
  }

  private processAutoClicker(): Observable<any> {
    return this.http.post<{ clicks_added: number }>(`${API_URL}home/auto-clicker/process`, {}, { headers: HomeService.headers });
  }

  public static get headers(): HttpHeaders {
    const telegramInitData = (window as any).Telegram?.WebApp?.initData || '';
    return new HttpHeaders()
      .set('X-Telegram-Init-Data', telegramInitData)
      .set('Content-Type', 'application/json');
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error details:', error);
    return throwError(() => new Error(error.message));
  }
}