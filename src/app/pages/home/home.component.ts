import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';;
import { HomeService, AutoClickerStatus } from '../../services/home.service';
import { take } from 'rxjs/operators';
import { ExchangeRatesService } from '../../services/exchange-rates.service';
import { ExchangeRates } from '../../services/exchange-rates.service'; // Или путь к файлу, где определен интерфейс

import {
  CachedNft,
  Skin,
  LeaderboardEntry,
} from '../../services/interfaces';
import { Router } from '@angular/router';

import * as HomeFunctions from '../../home.functions';
import { Subscription } from 'rxjs';
import { TelegramService } from '../../services/telegram.service';

declare global {
  interface Window {
    interval: number;
  }
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('modal') modal!: ElementRef;
  @ViewChild('overlay') overlay!: ElementRef;
  @ViewChild('newModal') newModal!: ElementRef;
  @ViewChild('newOverlay') newOverlay!: ElementRef;
  @ViewChild('leaderboardModal') leaderboardModal!: ElementRef;
  @ViewChild('leaderboardOverlay') leaderboardOverlay!: ElementRef;

  maxTaps: number = 0;
  energyPercentage: number = 0;
  cachedNft: CachedNft = HomeFunctions.DEFAULT_CACHED_NFT;
  balance: number = 0;
  energy: number = 0;
  currentImage: string = 'assets/images/default-nft.png';
  numbers: HomeFunctions.FloatingNumber[] = [];
  referralLink: string = '';
  qrCodeUrl: string = '';
  leaderboardType: 'sonics' | 'referrals' | 'spentNFT' = 'sonics';
  currentTokenPrice: number | null = null;
  currentBitcoinPrice: number = 0;
  clickValue: number = 1;
  leaderboardData: LeaderboardEntry[] = [];
  userRank: number = 0;
  showReferralModal: boolean = false;
  showLeaderboardModal: boolean = false;
  showBuyBitcoinModal: boolean = false;
  currentUserId: string = '';

  private clickCount = 0;
  private firstClickTimestamp: number | null = null;
  clientBalance = 1;
  private balanceSubscription: Subscription | undefined;
  
  
  private clickSendInterval: any;

  skins: Skin[] = HomeFunctions.SKINS;
  selectedSkin: Skin;

  autoClickerEnabled: boolean = false;
  private autoClickerSubscription: Subscription | null = null;

  constructor(
    private homeService: HomeService,
    private router: Router,
    private telegramService: TelegramService,
    private exchangeRatesService: ExchangeRatesService
  ) {
    this.homeService.energy$.subscribe(energy => {
      this.energy = energy;
    });
    this.updateEnergyPercentage();
    this.selectedSkin = this.skins[0];
    this.currentImage = this.selectedSkin.image1;
    this.homeService.balance$.subscribe(balance => this.balance = balance);
    
  }

  ngOnInit() {
    this.homeService.energy$.pipe(
      take(1)
    ).subscribe((energy: number) => {
      this.energy = energy;
      this.updateEnergyPercentage();
    });

    window.interval = 2000;

    this.balanceSubscription = this.homeService.balance$.subscribe(balance => {
      this.clientBalance = balance;
    });

    this.clickSendInterval = setInterval(() => this.sendClicks(), window.interval);

    this.checkAutoClickerStatus();

    this.homeService.initializeUserData().pipe(
      take(1)
    ).subscribe(() => {
      this.updateCurrentPrice();
      HomeFunctions.initializeComponent(this, this.homeService);
      HomeFunctions.preloadImages(this.skins);
      HomeFunctions.animateNumbers(this);
      this.checkAutoClickerStatus();
    });

    this.updateCurrentPrice();
    HomeFunctions.initializeComponent(this, this.homeService);
    HomeFunctions.preloadImages(this.skins);
    HomeFunctions.animateNumbers(this);
  }

  updateCurrentPrice() {
    this.exchangeRatesService.getExchangeRates().subscribe(
      (data: ExchangeRates) => {
        this.currentTokenPrice = data.harry_price_usd; // Предполагая, что usdt_to_harry - цена токена в USDT
      },
      (error) => {
        console.error('Error fetching token price:', error);
        // Обработка ошибки, например, отображение сообщения об ошибке пользователю
      }
    );
  }


  checkAutoClickerStatus() {
    this.homeService.getAutoClickerStatus().subscribe(
      (status: AutoClickerStatus) => {
        this.autoClickerEnabled = status.is_active;
        if (this.autoClickerEnabled) {
          this.startAutoClickerProcess();
        }
      },
      error => {
        console.error('Error getting auto-clicker status:', error);
      }
    );
  }

  toggleAutoClicker(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.autoClickerEnabled) {
      return;
    }

    this.homeService.toggleAutoClicker().subscribe(
      (response) => {
        this.autoClickerEnabled = true;
        this.startAutoClickerProcess();
      },
      (error) => {
        if (error.status === 403) {
          // Handle 403 error
        } else {
          if (this.telegramService.isTelegramWebAppAvailable()) {
            this.telegramService.showAlert('You need to own one of the two most expensive NFTs to use the auto-clicker');
          } else {
            console.warn('Telegram WebApp is not available');
          }
        }
      }
    );
  }

  private startAutoClickerProcess() {
    if (this.autoClickerEnabled && !this.autoClickerSubscription) {
      this.autoClickerSubscription = this.homeService.startAutoClickerProcess().subscribe(
        (result) => {
          console.log('Auto-clicker added clicks:', result.clicks_added);
        },
        (error) => {
          console.error('Error processing auto-clicker:', error);
        }
      );
    }
  }

  ngOnDestroy() {
    HomeFunctions.cleanupComponent(this);
    if (this.autoClickerSubscription) {
      this.autoClickerSubscription.unsubscribe();
    }

    if (this.clickSendInterval) {
      clearInterval(this.clickSendInterval);
    }

    if (this.balanceSubscription) {
      this.balanceSubscription.unsubscribe();
    }

  }

  onTap(event: TouchEvent | MouseEvent) {
    event.preventDefault();
    if (this.energy > 0) {
      if (this.clickCount === 0) {
        this.firstClickTimestamp = Date.now() / 1000;
      }
      this.clickCount++;
      
      const scorePerTap = this.cachedNft?.nft?.score_per_tap || 1;
      this.clientBalance += scorePerTap;
      this.energy -= scorePerTap;
      
      this.updateUIWithPendingClicks();
      HomeFunctions.handleTapVisuals(this, event);
  
      // Выводим информацию в alert
      // const alertInfo = `
      //   Click Count: ${this.clickCount}
      //   First Click Timestamp: ${this.firstClickTimestamp}
      //   Client Balance: ${this.clientBalance}
      //   Score Per Tap: ${scorePerTap}
      //   Energy: ${this.energy}
      //   Cached NFT: ${JSON.stringify(this.cachedNft)}
      // `;
      // alert(alertInfo);
  
      if (this.clickCount >= 50 || (Date.now() / 1000 - this.firstClickTimestamp! >= 5)) {
        this.sendClicks();
      }
    } else {
      if (this.telegramService.isTelegramWebAppAvailable()) {
        this.telegramService.showAlert('You used up all your energy for today. It will replenish tomorrow.');
      } else {
        console.warn('Telegram WebApp is not available');
      }
    }
  }

  private sendClicks() {
    if (this.clickCount === 0) return;
  
    // const clicksToSend = this.clickCount;
    this.homeService.sendClickBatch({
      clicks: this.clientBalance,
      timestamp: this.firstClickTimestamp!,
      current_client_balance: this.clientBalance
    }).subscribe(
      response => {
        this.clientBalance = response.new_balance;
        this.energy = response.clicks_left;
        this.updateUIWithConfirmedClicks(response);
      },
      error => {
        console.error('Error sending clicks:', error);
      }
    );
  
    this.clickCount = 0;
    this.firstClickTimestamp = null;
  }
  
  private updateUIWithPendingClicks() {
    this.balance = this.clientBalance;
    this.updateEnergyPercentage();
  }
  
  private updateUIWithConfirmedClicks(data: any) {
    this.balance = data.new_balance;
    this.energy = data.clicks_left;
    this.updateEnergyPercentage();
  }

  openModal(event: MouseEvent) {
    event.preventDefault();
    HomeFunctions.openModal(this);
  }

  closeModal() {
    HomeFunctions.closeModal(this);
  }

  openNewModal(event: Event) {
    event.preventDefault();
    HomeFunctions.openNewModal(this);
  }

  closeNewModal() {
    HomeFunctions.closeNewModal(this);
  }

  openLeaderboardModal(event: MouseEvent) {
    event.preventDefault();
    HomeFunctions.openLeaderboardModal(this);
  }

  closeLeaderboard() {
    HomeFunctions.closeLeaderboard(this);
  }

  setLeaderboardType(type: 'sonics' | 'referrals' | 'spentNFT') {
    HomeFunctions.setLeaderboardType(this, type, this.homeService);
  }

  copyReferralLink() {
    HomeFunctions.copyReferralLink(this.referralLink, this.telegramService);
  }

  openLink(url: string) {
    window.open(url, '_blank');
  }

  selectSkinById(id: number) {
    HomeFunctions.selectSkinById(this, id);
  }

  onPlayClick(event: Event): void {
    event.preventDefault();
    HomeFunctions.handlePlayClick(this, this.homeService, this.router, this.telegramService);
  }

  private updateEnergyPercentage() {
    if (this.maxTaps > 0) {
      this.energyPercentage = (this.energy / this.maxTaps) * 100;
    } else {
      this.energyPercentage = 0;
    }
  }
}