import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { API_URL } from '../constants';

export interface Referral {
  referred_id: number;
  total_earnings: number;
  created_at: string;
  sub_referrals_count: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReferralService {

  constructor(private http: HttpClient, private authService: AuthService) { }

  getReferralsCount(): Observable<Referral[]> {
    return this.http.get<Referral[]>(`${API_URL}/team/referrals-count`, { headers: AuthService.headers });
  }

  getTotalMembers(): Observable<Referral[]> {
    return this.http.get<Referral[]>(`${API_URL}/team/total-members`, { headers: AuthService.headers });
  }

  getRealMoney(): Observable<Referral[]> {
    return this.http.get<Referral[]>(`${API_URL}/team/real-money`, { headers: AuthService.headers });
  }

  getReferralsEnergy(): Observable<Referral[]> {
    return this.http.get<Referral[]>(`${API_URL}/team/referrals-energy`, { headers: AuthService.headers });
  }
}



// ВОЗЖМОЖНО ЭТА ПАРАША ВООБЩЕ НЕ НУЖНА ТАК КАК ДУБЛИРУЕТСЯ С TEAM.SERVICE.TS  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////