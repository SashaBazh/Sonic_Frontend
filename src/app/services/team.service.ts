import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = '/api/team';

  constructor(private http: HttpClient) { }

  // ПОЛУЧЕНИЕ С БЭКА ОБЩЕЕ КОЛИЧЕСТВО ЮЗЕРОВ В БОТЕ  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getTotalMembers(): Observable<{ total_members: number }> {
    return this.http.get<{ total_members: number }>(`${this.apiUrl}/total-members`);
  }

  // ПОЛУЧЕНИЕ С БЭКА КОЛИЧЕСТВО ТВОИХ РЕФОК ПО ВСЕМ 3 УРОВНЯМ  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getReferralsCount(): Observable<{ total_referrals: number }> {
    return this.http.get<{ total_referrals: number }>(`${this.apiUrl}/referrals-count`);
  }

  // ПОЛУЧЕНИЕ С БЭКА ОБЩЕЕ КОЛИЧЕСВО ДЕНЕГ СКОЛЬКО ТЫ ЗАРАБОТАЛ С РЕФОК  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getRealMoney(): Observable<{ real_money: number }> {
    return this.http.get<{ real_money: number }>(`${this.apiUrl}/real-money`);
  }

  // ПОЛУЧЕНИЕ С БЭКА ОБЩЕЕ КОЛИЧЕСВО ВНУТРЕИГРОВОЙ ВАЛЮТЫ С РЕФОК 1 УРОВНЯ  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getReferralsEnergy(): Observable<{ referrals_energy: number }> {
    return this.http.get<{ referrals_energy: number }>(`${this.apiUrl}/referrals-energy`);
  }
}