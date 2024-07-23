import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = '/api/team';

  constructor(private http: HttpClient) { }

  getTotalMembers(): Observable<{ total_members: number }> {
    return this.http.get<{ total_members: number }>(`${this.apiUrl}/total-members`);
  }

  getReferralsCount(): Observable<{ total_referrals: number }> {
    return this.http.get<{ total_referrals: number }>(`${this.apiUrl}/referrals-count`);
  }

  getRealMoney(): Observable<{ real_money: number }> {
    return this.http.get<{ real_money: number }>(`${this.apiUrl}/real-money`);
  }

  getReferralsEnergy(): Observable<{ referrals_energy: number }> {
    return this.http.get<{ referrals_energy: number }>(`${this.apiUrl}/referrals-energy`);
  }
}