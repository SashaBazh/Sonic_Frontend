import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';;
import { HomeService, AutoClickerStatus } from '../../services/home.service';
import { take } from 'rxjs/operators';
import {
  CachedNft,
  Skin,
  LeaderboardEntry,
} from '../../services/interfaces';
import { Router } from '@angular/router';

import * as HomeFunctions from '../../home.functions';
import { Subscription } from 'rxjs';

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

  autoClickerEnabled: boolean = false;
  autoClickerAvailable: boolean = false;
  private autoClickerSubscription: Subscription | null = null;

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

  skins: Skin[] = HomeFunctions.SKINS;
  selectedSkin: Skin;

  constructor(
    private homeService: HomeService, private router: Router
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
  
    this.homeService.initializeUserData().pipe(
      take(1)
    ).subscribe(() => {
      this.updateCurrentPrice();
      HomeFunctions.initializeComponent(this, this.homeService);
      HomeFunctions.preloadImages(this.skins);
      HomeFunctions.animateNumbers(this);
      this.checkAutoClickerStatus();
    });

    // alert(JSON.stringify(this.energy));
    // alert(JSON.stringify(this.maxTaps));
    
    this.updateCurrentPrice();
    HomeFunctions.initializeComponent(this, this.homeService);
    HomeFunctions.preloadImages(this.skins);
    HomeFunctions.animateNumbers(this);
    this.checkAutoClickerStatus();
  }

  updateCurrentPrice() {
    HomeFunctions.getCurrentPrice().then(price => {
        this.currentTokenPrice = price;
    });
}


  checkAutoClickerStatus() {
    this.homeService.getAutoClickerStatus().subscribe(
      (status: AutoClickerStatus) => {
        this.autoClickerEnabled = status.is_active;
        this.autoClickerAvailable = status.is_available;
        if (this.autoClickerEnabled) {
          this.startAutoClickerProcess();
        }
      },
      error => {
        console.error('Error getting auto-clicker status:', error);
        this.autoClickerAvailable = false;
        this.autoClickerEnabled = false;
      }
    );
  }

  toggleAutoClicker(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.autoClickerAvailable) {
      alert('Auto-clicker is not available. You need to own the two most expensive NFTs to use it.');
      return;
    }

    this.homeService.toggleAutoClicker().subscribe(
      (response) => {
        this.autoClickerEnabled = !this.autoClickerEnabled;
        if (this.autoClickerEnabled) {
          this.startAutoClickerProcess();
        } else {
          this.stopAutoClickerProcess();
        }
      },
      (error) => {
        console.error('Error toggling auto-clicker:', error);
      }
    );
  }

  private startAutoClickerProcess() {
    if (this.autoClickerEnabled && !this.autoClickerSubscription) {
      this.autoClickerSubscription = this.homeService.startAutoClickerProcess().subscribe(
        (result) => {
          console.log('Auto-clicker added clicks:', result.clicks_added);
          // Update user balance if necessary
        },
        (error) => {
          console.error('Error processing auto-clicker:', error);
        }
      );
    }
  }

  private stopAutoClickerProcess() {
    if (this.autoClickerSubscription) {
      this.autoClickerSubscription.unsubscribe();
      this.autoClickerSubscription = null;
    }
  }


  ngOnDestroy() {
    HomeFunctions.cleanupComponent(this);
    this.stopAutoClickerProcess();

  }

  // private updateEnergy() {
  //   HomeFunctions.getLeftEnergy(this, this.homeService);
  // }

  onTap(event: TouchEvent | MouseEvent) {
    // alert(JSON.stringify(this.energy));
    // alert(JSON.stringify(this.maxTaps));
    event.preventDefault();
    HomeFunctions.handleTap(this, event, this.homeService);
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
    HomeFunctions.copyReferralLink(this.referralLink);
  }

  openLink(url: string) {
    window.open(url, '_blank');
  }

  selectSkinById(id: number) {
    HomeFunctions.selectSkinById(this, id);
  }

  onPlayClick(event: Event): void {
    event.preventDefault();
    HomeFunctions.handlePlayClick(this, this.homeService, this.router);
    // alert("The game will appear in the next update");
  }

  private updateEnergyPercentage() {
    if (this.maxTaps > 0) {
      this.energyPercentage = (this.energy / this.maxTaps) * 100;
    } else {
      this.energyPercentage = 0;
    }
  }
}