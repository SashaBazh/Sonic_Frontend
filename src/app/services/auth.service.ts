import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, retry, map } from 'rxjs/operators';

// ХУЙНЯ ГДЕ ИЗНАЧАЛЬНО НАХОДИЛИСЬ ВСЕ ЗАПРОСЫ К БЭКУ 
// ПОТОМ ПО ТИХУ РАССТАВЛЯЛ В НУЖНЫЕ СЕРВИСЫ
// И ДО СИХ ПОР ЧТО ТО РАБОАТЕТ ОТ СЮДА
// ПОЭТОМУ ГДЕ ТО В БУДЕЩЕМ ДЛЯ ЧИСТОТЫ КОДА 
// МОЖНО ВСЕ РАССТАВИТЬ ПО СВИМ МЕСТАМ 
// ПОКА НЕ ХОЧУ ТУТ НИЧЕГО МЕНЯТЬ //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

interface Task {
  task_id: number;
  name: string;
  award: number;
  condition: string;
  image_uri: string;
  description: string;
  completed: boolean;
}

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

interface UserResponse {
  user_id: number;
  telegram_id: number;
  sonic_balance: number;
  referral_balance: number;
  totalreferralBalance: number;
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
  current: number;
  max: number;
}

interface EnergyResponse {
  left_energy: number;
}

interface ReferralEnergyResponse {
  referrals_energy: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public static readonly API_URL = 'https://harrypotterobamasonic10.com/api/';

  private lastGameTime: Date | null = null;

  private referralLinkSubject = new BehaviorSubject<string>('');
  public referralLink$ = this.referralLinkSubject.asObservable();

  private balanceSubject = new BehaviorSubject<number>(0);
  public balance$ = this.balanceSubject.asObservable();

  private referralBalanceSubject = new BehaviorSubject<number>(0);
  public referralBalance$ = this.referralBalanceSubject.asObservable();

  private totalreferralBalanceSubject = new BehaviorSubject<number>(0);
  public totalreferralBalance$ = this.totalreferralBalanceSubject.asObservable();

  private energySubject = new BehaviorSubject<number>(0);
  public energy$ = this.energySubject.asObservable();

  private totalMembersSubject = new BehaviorSubject<number>(0);
  public totalMembers$ = this.totalMembersSubject.asObservable();

  private totalReferralsSubject = new BehaviorSubject<number>(0);
  public totalReferrals$ = this.totalReferralsSubject.asObservable();

  private referralEnergySubject = new BehaviorSubject<number>(0);
  public referralEnergy$ = this.referralEnergySubject.asObservable();

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  constructor(private http: HttpClient) {

    const storedTime = localStorage.getItem('lastGameTime');
    if (storedTime) {
      this.lastGameTime = new Date(storedTime);
    }
  }

  getAvailableTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${AuthService.API_URL}task/`, { headers: AuthService.headers }).pipe(
      tap(tasks => this.tasksSubject.next(tasks)),
      catchError(this.handleError)
    );
  }

  completeTask(taskId: number): Observable<any> {
    return this.http.post<any>(`${AuthService.API_URL}task/`, { task_id: taskId }, { headers: AuthService.headers }).pipe(
      tap(response => {
        const currentTasks = this.tasksSubject.value;
        const updatedTasks = currentTasks.map(task =>
          task.task_id === taskId ? { ...task, completed: true } : task
        );
        this.tasksSubject.next(updatedTasks);
      }),
      catchError(this.handleError)
    );
  }

  canPlayGame(): boolean {
    if (!this.lastGameTime) {
      return true;
    }
    const now = new Date();
    const timeDiff = now.getTime() - this.lastGameTime.getTime();
    return timeDiff >= 24 * 60 * 60 * 1000;
  }


  playGame(): Observable<any> {
    return this.http.get<any>(`${AuthService.API_URL}home/game-status`, { headers: AuthService.headers }).pipe(
      tap(response => {
        if (response.can_game) {
          this.lastGameTime = new Date();
          localStorage.setItem('lastGameTime', this.lastGameTime.toString());
        }
      }),
      retry(3),
      catchError(this.handleError)
    );
  }

  submitGameResult(score: number, isWin: boolean): Observable<any> {
    const payload = {
      game_points: score,
      is_win: isWin
    };
    return this.http.post<any>(`${AuthService.API_URL}home/add-game-points`, payload, { headers: AuthService.headers }).pipe(
      tap(response => {
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

  public static get headers(): HttpHeaders {
    const telegramInitData = (window as any).Telegram?.WebApp?.initData || '';
    return new HttpHeaders()
      .set('X-Telegram-Init-Data', telegramInitData)
      .set('Content-Type', 'application/json');
  }

  getReferralEnergy(): Observable<number> {
    return this.http.get<ReferralEnergyResponse>(`${AuthService.API_URL}team/referrals-energy`, { headers: AuthService.headers })
      .pipe(
        map(response => response.referrals_energy),
        tap(energy => this.updateReferralEnergy(energy)),
        retry(3),
        catchError(this.handleError)
      );
  }

  getMostExpensiveNft(): Observable<UserNftResponse> {
    return this.http.get<UserNftResponse>(`${AuthService.API_URL}nft/my`, { headers: AuthService.headers })
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

  getAllUserNfts(): Observable<UserNftResponse> {
    return this.http.get<UserNftResponse>(`${AuthService.API_URL}nft/my-all`, { headers: AuthService.headers })
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  private updateActiveSkin(nftId: number) {
  }

  getUserBalance(): Observable<number> {
    return this.http.get<UserResponse>(`${AuthService.API_URL}user/balances`, { headers: AuthService.headers })
      .pipe(
        map(response => response.sonic_balance),
        tap(balance => this.updateBalance(balance)),
        retry(3),
        catchError(this.handleError)
      );
  }

  getUserReferralBalance(): Observable<number> {
    return this.http.get<UserResponse>(`${AuthService.API_URL}user/balances`, { headers: AuthService.headers })
      .pipe(
        map(response => response.referral_balance),
        tap(balance => {
          this.updateReferralBalance(balance);
        }),
        retry(3),
        catchError(this.handleError)
      );
  }

  getUserTotalReferralBalance(): Observable<number> {
    return this.http.get<{ real_money: number }>(`${AuthService.API_URL}team/real-money`, { headers: AuthService.headers })
      .pipe(
        map(response => response.real_money),
        tap(balance => {
          this.updatetotalReferralBalance(balance);
        }),
        retry(3),
        catchError(this.handleError)
      );
  }

  updateReferralEnergy(energy: number) {
    this.referralEnergySubject.next(energy);
  }

  updateBalance(balance: number) {
    this.balanceSubject.next(balance);
  }

  updateReferralBalance(balance: number) {
    this.referralBalanceSubject.next(balance);
  }

  updatetotalReferralBalance(balance: number) {
    this.totalreferralBalanceSubject.next(balance);
  }

  getTotalMembers(): Observable<number> {
    return this.http.get<{ total_members: number }>(`${AuthService.API_URL}team/total-members`, { headers: AuthService.headers })
      .pipe(
        map(response => response.total_members),
        tap(total => this.updateTotalMembers(total)),
        retry(3),
        catchError(this.handleError)
      );
  }

  getReferralsCount(): Observable<number> {
    return this.http.get<{ total_referrals: number }>(`${AuthService.API_URL}team/referrals-count`, { headers: AuthService.headers })
      .pipe(
        map(response => response.total_referrals),
        tap(total => this.updateTotalReferrals(total)),
        retry(3),
        catchError(this.handleError)
      );
  }

  updateTotalMembers(total: number) {
    this.totalMembersSubject.next(total);
  }

  updateTotalReferrals(total: number) {
    this.totalReferralsSubject.next(total);
  }

  getLeftEnergy(): Observable<number> {
    return this.http.get<EnergyResponse>(`${AuthService.API_URL}home/left-energy`, { headers: AuthService.headers })
      .pipe(
        map(response => response.left_energy),
        tap(energy => this.updateEnergy(energy)),
        retry(3),
        catchError(this.handleError)
      );
  }

  updateEnergy(energy: number) {
    this.energySubject.next(energy);
  }

  click(): Observable<number> {
    return this.http.post<ClickResponse>(`${AuthService.API_URL}home/click`, {}, { headers: AuthService.headers }).pipe(
      map(response => response.clicks),
      tap(clicks => {
        console.log('Click registered successfully:', clicks);
        this.updateBalance(clicks);
      }),
      retry(3),
      catchError(this.handleError)
    );
  }

  getLeaderboardSonics(): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${AuthService.API_URL}home/leader-board-sonics`, { headers: AuthService.headers })
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  getLeaderboardReferrals(): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${AuthService.API_URL}home/leader-board-referrals`, { headers: AuthService.headers })
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  getLeaderboardSpentNFT(): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${AuthService.API_URL}home/leader-board-spent-nft`, { headers: AuthService.headers })
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  getReferralLink(): Observable<string> {
    return this.http.get<any>(`${AuthService.API_URL}home/referral-link`, { headers: AuthService.headers }).pipe(
      map(response => response.referral_link),
      tap(link => {
        this.referralLinkSubject.next(link);
      }),
      retry(3),
      catchError(this.handleError)
    );
  }

  generateQRCode(link: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(link)}`;
  }

  toggleAutoClicker(): Observable<any> {
    return this.http.post(`${AuthService.API_URL}/auto-clicker`, {}, { headers: AuthService.headers }).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  getAutoClickerStatus(): Observable<any> {
    return this.http.get(`${AuthService.API_URL}/auto-clicker`, { headers: AuthService.headers }).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  addGamePoints(points: number): Observable<any> {
    return this.http.post(`${AuthService.API_URL}/add-game-points`, { game_points: points }, { headers: AuthService.headers }).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }


  withdrawFunds(withdrawData: {
    payment_system: string,
    withdraw_amount: number,
    withdraw_address: string
  }): Observable<any> {
    return this.http.post(`${AuthService.API_URL}user/withdraw`, withdrawData, { headers: AuthService.headers })
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error details:', error);
    return throwError(() => new Error(error.message));
  }
}