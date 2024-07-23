import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { NftService } from '../../services/nft.service';
import { PaymentService } from '../../services/payment.service';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import qrcode from 'qrcode-generator';
import WebApp from '@twa-dev/sdk';
import { Router, NavigationEnd } from '@angular/router';

interface NFT {
  nft_id: number;
  name: string;
  max_taps: number;
  score_per_tap: number;
  price: number;
  image_uri: string;
  real_money_1_level: number;
  real_money_2_level: number;
  real_money_3_level: number;
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

@Component({
  selector: 'app-buynft',
  templateUrl: './buynft.component.html',
  styleUrls: ['./buynft.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class BuynftComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('modal') modal!: ElementRef;
  @ViewChild('overlay') overlay!: ElementRef;
  @ViewChild('selectButton') selectButton!: ElementRef;
  @ViewChild('selectContainer') selectContainer!: ElementRef;
  @ViewChild('options') options!: ElementRef;

  selectedCurrency: string = '';
  selectedAmount: number = 0;
  selectedNFT: NFT | null = null;
  paymentConfirmed: boolean = false;

  showModal_buy: boolean = false;
  timeToPayFormatted: string = '';
  address: string = '';
  qrCodeUrl: string = '';
  private timer: Subscription | null = null;
  isQRCodeLoading: boolean = false;

  nfts: NFT[] = [];
  isSelectOpen: boolean = false;

  currentNFT: NftResponse | null = null;
  isNftActive: boolean = false;

  paymentId: number | null = null;
  paymentCheckInterval: Subscription | null = null;

  isLoadingCurrentNFT: boolean = false;
  isLoadingNFTs: boolean = false;
  isCheckingPayment: boolean = false;
  loadError: boolean = false;
  purchaseSuccess: boolean = false;

  buyOption: 'usd' | 'star' = 'usd';
  supportedCurrencies: string[] = [];
  paymentDetails: any;
  isLoading: boolean | undefined;

  originalPrice: number = 0;

  constructor(
    private nftService: NftService,
    private paymentService: PaymentService,
    private router: Router
  ) { 
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.setupBackButton(event.url);
      }
    });
  }

  setupBackButton(currentUrl: string) {
    if (currentUrl === '/home') {
      WebApp.BackButton.hide();
      WebApp.MainButton.setText('Отмена');
      WebApp.MainButton.onClick(() => {
        WebApp.close();
      });
    } else {
      WebApp.MainButton.hide();
      WebApp.BackButton.show();
      WebApp.onEvent('backButtonClicked', () => {
        this.router.navigate(['/home']);
      });
    }
  }

  ngOnInit() {
    this.loadCurrentNFT();
    this.loadNfts();
    this.loadSupportedCurrencies();
    this.setupBackButton(this.router.url);

  }

  ngAfterViewInit() {
    if (this.selectButton) {
      this.selectButton.nativeElement.addEventListener('click', this.toggleSelect.bind(this));
    }
  }

  loadNfts() {
    this.isLoadingNFTs = true;
    this.nftService.getAvailableNfts().subscribe(
      (nfts) => {
        this.nfts = nfts;
        this.isLoadingNFTs = false;
        this.loadError = false;
      },
      (error) => {
        this.isLoadingNFTs = false;
        this.loadError = true;
      }
    );
  }

  loadCurrentNFT() {
    this.isLoadingCurrentNFT = true;
    this.nftService.getCurrentNft().subscribe({
      next: (response: UserNftResponse) => {
        this.currentNFT = response.nft;
        this.isNftActive = response.is_active;
        this.isLoadingCurrentNFT = false;
      },
      error: (error) => {
        this.isLoadingCurrentNFT = false;
      }
    });
  }

  openModal(nft: NFT, option: 'usd' | 'star') {
    this.selectedNFT = nft;
    this.buyOption = option;
    this.originalPrice = nft.price;
    this.selectedCurrency = 'USDTTRC20';
  
    if (option === 'usd') {
      this.isLoading = true;
      this.updatePrice();
    } else {
      this.selectedAmount = nft.price;
      this.showModal();
    }
  }


  updatePrice() {
    if (this.selectedNFT) {
      const coinId = this.getCoinGeckoId(this.selectedCurrency);
      this.paymentService.getPrice(coinId).subscribe(
        (price) => {
          this.selectedAmount = this.originalPrice * price;
          this.isLoading = false;
          this.showModal();
        },
        (error) => {
          console.error('Error fetching price from CoinGecko:', error);
          this.isLoading = false;
          // Обработка ошибки
        }
      );
    }
  }

  getCoinGeckoId(currency: string): string {
    switch (currency) {
      case 'BNBBSC':
        return 'binancecoin';
      case 'TON':
        return 'the-open-network';
      case 'USDTTRC20':
        return 'tether';
      default:
        return 'tether';
    }
  }

  selectOption(event: Event) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'LI') {
      this.selectedCurrency = target.getAttribute('data-value') || 'TON';
      this.selectButton.nativeElement.textContent = `${this.selectedCurrency} ▼`;
      this.selectContainer.nativeElement.classList.remove('active');
      this.options.nativeElement.style.display = "none";
      this.isSelectOpen = false;
      this.updatePrice();
    }
  }

  
  private showModal() {
    this.modal.nativeElement.style.display = 'block';
    this.overlay.nativeElement.style.display = 'block';
    this.selectButton.nativeElement.textContent = `${this.selectedCurrency} ▼`;
  }

  closeModal() {
    this.modal.nativeElement.style.display = 'none';
    this.overlay.nativeElement.style.display = 'none';
    this.options.nativeElement.style.display = 'none';
  }

  loadSupportedCurrencies() {
    this.paymentService.getSupportedCurrencies().subscribe(
      (currencies) => {
        this.supportedCurrencies = currencies;
      },
      (error) => {
      }
    );
  }

  async buyNFT() {
    this.openModal_buy();
    if (this.buyOption === 'usd') {
      if (this.selectedNFT) {
        this.isCheckingPayment = true;
        this.isQRCodeLoading = true;
        this.paymentService.createPayment(this.selectedNFT.nft_id, this.selectedCurrency).subscribe(
          async (response) => {
            this.paymentId = response.payment_id;
            this.address = response.pay_address;
            this.qrCodeUrl = await this.generateQRCode();
            // Здесь мы не обновляем selectedAmount, так как оно уже установлено
            this.selectedCurrency = response.pay_currency;

            this.paymentDetails = response;

            this.startPaymentCheck();
            this.isCheckingPayment = false;
            this.isQRCodeLoading = false;
          },
          (error) => {
            console.error('Error creating payment:', error);
            this.isCheckingPayment = false;
            this.isQRCodeLoading = false;
          }
        );
      }
    } else if (this.buyOption === 'star') {
      // Логика для покупки за звезды
    }
  }

  simulatePayment() {
    if (this.paymentId) {
      this.isCheckingPayment = true;
      this.paymentService.simulatePayment(this.paymentId).subscribe(
        (response) => {
          this.checkPaymentStatus();
        },
        (error) => {
          this.isCheckingPayment = false;
        }
      );
    }
  }

  startPaymentCheck() {
    if (this.paymentId) {
      this.paymentCheckInterval = interval(10000)
        .pipe(take(36))
        .subscribe(() => {
          this.checkPaymentStatus();
        });
    }
  }

  checkPaymentStatus() {
    if (this.paymentId) {
      this.isCheckingPayment = true;
      this.paymentService.checkPayment(this.paymentId).subscribe(
        (response) => {
          if (response.payment_status === 'finished' || response.payment_status === 'confirmed') {
            this.paymentConfirmed = true;
            this.closeModal_buy();
            this.closeModal();
            this.stopPaymentCheck();
            this.loadNfts();
            this.loadCurrentNFT();
            this.purchaseSuccess = true;
            setTimeout(() => this.purchaseSuccess = false, 5000);
          } else {
            this.paymentConfirmed = false;
          }
          this.isCheckingPayment = false;
        },
        (error) => {
          this.isCheckingPayment = false;
        }
      );
    }
  }

  stopPaymentCheck() {
    if (this.paymentCheckInterval) {
      this.paymentCheckInterval.unsubscribe();
      this.paymentCheckInterval = null;
    }
  }

  openModal_buy() {
    this.showModal_buy = true;
    this.startPaymentTimer();
  }

  closeModal_buy() {
    this.showModal_buy = false;
    this.stopPaymentTimer();
    this.stopPaymentCheck();
  }

  private async generateQRCode(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Не удалось получить контекст canvas');

      canvas.width = 200;
      canvas.height = 200;

      const qr = qrcode(0, 'M');
      qr.addData(`${this.address}`);
      qr.make();

      const moduleCount = qr.getModuleCount();
      const moduleSize = 200 / moduleCount;

      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          const x = col * moduleSize;
          const y = row * moduleSize;
          ctx.fillStyle = qr.isDark(row, col) ? '#000000' : '#FFFFFF';
          ctx.fillRect(x, y, moduleSize, moduleSize);
        }
      }

      return canvas.toDataURL();
    } catch (error) {
      return '';
    }
  }

  private startPaymentTimer() {
    this.stopPaymentTimer();
    let timeLeft = 3600;
    this.updateTimerDisplay(timeLeft);

    this.timer = interval(1000).subscribe(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        this.stopPaymentTimer();
        this.closeModal_buy();
      } else {
        this.updateTimerDisplay(timeLeft);
      }
    });
  }

  private stopPaymentTimer() {
    if (this.timer) {
      this.timer.unsubscribe();
      this.timer = null;
    }
  }

  private updateTimerDisplay(timeLeft: number) {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    this.timeToPayFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
    }, (err) => {
    });
  }

  toggleSelect(event: Event) {
    event.stopPropagation();
    this.isSelectOpen = !this.isSelectOpen;
    this.selectContainer.nativeElement.classList.toggle('active');
    const isActive = this.selectContainer.nativeElement.classList.contains('active');
    this.options.nativeElement.style.display = isActive ? 'block' : 'none';
  }

  cancelPayment() {
    this.closeModal_buy();
    if (this.paymentId) {
      this.isCheckingPayment = true;
      this.paymentService.cancelPayment(this.paymentId).subscribe(
        (response) => {
          this.stopPaymentCheck();
          this.isCheckingPayment = false;
        },
        (error) => {
          this.isCheckingPayment = false;
        }
      );
    }
  }

  ngOnDestroy() {
    this.stopPaymentTimer();
    this.stopPaymentCheck();
    if (this.selectButton && this.selectButton.nativeElement) {
      this.selectButton.nativeElement.removeEventListener('click', this.toggleSelect.bind(this));
    }
  }
}