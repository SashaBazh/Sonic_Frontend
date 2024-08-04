// nft.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, retry } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})
export class NftService {
  private API_URL = 'https://harrypotterobamasonic10.com/api/';

  public currentNFT: UserNftResponse | undefined;

  constructor(private http: HttpClient) { }

  // ПОЛУЧЕНИЕ С БЭКА ИНФУ О ДОСТУПНЫХ NFT //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getAvailableNfts(): Observable<any> {
    return this.http.get(`${this.API_URL}nft/available`, { headers: NftService.headers });
  }

  // ПОЛУЧЕНИЕ С БЭКА ИНФУ О ТЕКУЩЕЙ NFT ЮЗЕРА //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getCurrentNft(): Observable<UserNftResponse> {
    return this.http.get<UserNftResponse>(`${this.API_URL}nft/my`, { headers: NftService.headers })
      .pipe(
        tap(response => {
          if (response) {
            this.currentNFT = response
          }
        }),
        retry(3),
      );
  }

  public static get headers(): HttpHeaders {
    const telegramInitData = (window as any).Telegram?.WebApp?.initData || '';
    return new HttpHeaders()
      .set('X-Telegram-Init-Data', telegramInitData)
      .set('Content-Type', 'application/json');
  }
}