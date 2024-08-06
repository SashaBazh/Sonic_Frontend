import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HomeService } from '../app/services/home.service';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { TelegramService } from '../app/services/telegram.service';

import {
    CachedNft,
    Skin,
    LeaderboardEntry,
    LeaderboardResponse,
    NftResponse,
    UserNftResponse
} from '../app/services/interfaces';


export const DEFAULT_NFT: NftResponse = {
    nft_id: 0,
    name: "Default NFT",
    max_taps: 10,
    score_per_tap: 1,
    price: 0,
    in_game_points_1_level: 0,
    real_money_1_level: 0,
    real_money_2_level: 0,
    real_money_3_level: 0,
    game_max_score: 100
};

export const DEFAULT_CACHED_NFT: CachedNft = {
    nft: DEFAULT_NFT,
    is_active: false,
    lastUpdated: 0
};

export const SKINS: Skin[] = [
    { id: 1, name: 'Sonic_blue', image1: 'assets/images/NFT/1_sonic_blue_1.png', image2: 'assets/images/NFT/1_sonic_blue_2.png' },
    { id: 2, name: 'Sonic_red', image1: 'assets/images/NFT/1_sonic_red_1.png', image2: 'assets/images/NFT/1_sonic_red_2.png' },
    { id: 3, name: 'Harry_black', image1: 'assets/images/NFT/1_harry_black_1.png', image2: 'assets/images/NFT/1_harry_black_2.png' },
    { id: 4, name: 'Obama_black', image1: 'assets/images/NFT/1_obama_black_1.png', image2: 'assets/images/NFT/1_obama_black_2.png' },
    { id: 5, name: 'Harry_red', image1: 'assets/images/NFT/1_harry_red_1.png', image2: 'assets/images/NFT/1_harry_red_2.png' },
    { id: 6, name: 'Obama_white', image1: 'assets/images/NFT/1_obama_white_1.png', image2: 'assets/images/NFT/1_obama_white_2.png' },
    { id: 7, name: 'Sonic_gold', image1: 'assets/images/NFT/1_sonic_gold_1.png', image2: 'assets/images/NFT/1_sonic_gold_2.png' },
];

export interface FloatingNumber {
    x: number;
    y: number;
    value: number | string;
    isNumber: boolean;
    velocityY: number;
}

// ИНИЦИАЛИЗАЦИЯ КОМПОНЕНТОВ  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function initializeComponent(component: any, homeService: HomeService) {
    getCurrentPrice(component);
    getReferralLink(component, homeService);
    getBalance(component, homeService);

    homeService.energy$.pipe(take(1)).subscribe(energy => {
        component.energy = energy;
        component.updateEnergyPercentage();
    });

    homeService.maxTaps$.pipe(take(1)).subscribe(maxTaps => {
        component.maxTaps = maxTaps;
        component.updateEnergyPercentage();
    });

    getCachedNft(component, homeService).subscribe(
        (cachedNft: CachedNft) => {
            component.cachedNft = cachedNft;
            if (cachedNft.nft && cachedNft.is_active) {
                selectSkinById(component, cachedNft.nft.nft_id);
            }
        },
    );
}

// ВРОДЕ КАК ОТКЛЮЧЕНИЕ АВТОКЛИКЕРА //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function cleanupComponent(component: any) {
    if (component.autoClickerSubscription) {
        component.autoClickerSubscription.unsubscribe();
    }
    getBalance(component, component.homeService);
}

// ПОЛУЧЕНИЕ NFT ИЗ КЭША //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function getCachedNft(component: any, homeService: HomeService): Observable<CachedNft> {
    const cacheTime = 5 * 60 * 1000;

    if (component.cachedNft.nft && (Date.now() - component.cachedNft.lastUpdated < cacheTime)) {
        return of(component.cachedNft);
    }

    return homeService.getMostExpensiveNft().pipe(
        map((response: UserNftResponse) => {
            const cachedNft: CachedNft = {
                nft: response.nft || DEFAULT_NFT,
                is_active: response.is_active,
                lastUpdated: Date.now()
            };
            component.cachedNft = cachedNft;
            return cachedNft;
        }),
    );
}

// ЗАГРУЗКА КАРТИНОК //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function preloadImages(skins: Skin[]) {
    skins.forEach(skin => {
        [skin.image1, skin.image2].forEach(imageSrc => {
            const img = new Image();
            img.src = imageSrc;
        });
    });
}

// ПОЛУЧЕНИЕ КОЛИЧЕСТВА ОЧКОВ ЗА ТАП //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const getScorePerTap = (currentNft: any) => {
    return currentNft.score_per_tap;
};

// ТАП //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function handleTapVisuals(component: any, event: TouchEvent | MouseEvent) {
    const currentNft = component.cachedNft.nft || DEFAULT_NFT;
    
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(100);
      } catch (error) {
        console.error('Failed to vibrate:', error);
      }
    }
    
    component.currentImage = component.currentImage === component.selectedSkin.image1
      ? component.selectedSkin.image2
      : component.selectedSkin.image1;
  
    let touches: Touch[] = [];
    if (event instanceof TouchEvent) {
      touches = Array.from(event.touches);
    } else {
      touches = [{ clientX: event.clientX, clientY: event.clientY } as Touch];
    }
  
    touches.forEach(touch => {
      const scorePerTap = currentNft.score_per_tap;
      component.numbers.push(
        {
          x: touch.clientX - 15,
          y: touch.clientY - 30,
          value: 'coin',
          isNumber: false,
          velocityY: -5
        },
        {
          x: touch.clientX + 15,
          y: touch.clientY - 30,
          value: scorePerTap,
          isNumber: true,
          velocityY: -5
        }
      );
  
      setTimeout(() => {
        const index = component.numbers.findIndex((n: FloatingNumber) => n.x === touch.clientX - 15 && n.y === touch.clientY - 30);
        if (index > -1) {
          component.numbers.splice(index, 2);
        }
      }, 1000);
    });
  }

// АНИМАЦИЯ ЦИФР ПРИ ТАПАХ //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function animateNumbers(component: any) {
    component.numbers.forEach((item: FloatingNumber) => {
        item.y += item.velocityY;
        item.velocityY += 0.2;
        item.x += Math.random() * 2 - 1;
    });

    component.numbers = component.numbers.filter((item: FloatingNumber) => item.y > 0);

    requestAnimationFrame(() => animateNumbers(component));
}

// ОТКРЫТИЕ/ЗАКРЫТИЕ МОДАЛОК //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function openModal(component: any) {
    if (component.modal) component.modal.nativeElement.style.display = "block";
    if (component.overlay) component.overlay.nativeElement.style.display = "block";
    component.qrCodeUrl = generateQRCode(component.referralLink);
}

export function closeModal(component: any) {
    if (component.modal) component.modal.nativeElement.style.display = "none";
    if (component.overlay) component.overlay.nativeElement.style.display = "none";
}

export function openNewModal(component: any) {
    if (component.newModal) component.newModal.nativeElement.style.display = "block";
    if (component.newOverlay) component.newOverlay.nativeElement.style.display = "block";
}

export function closeNewModal(component: any) {
    if (component.newModal) component.newModal.nativeElement.style.display = 'none';
    if (component.newOverlay) component.newOverlay.nativeElement.style.display = 'none';
}

export function openLeaderboardModal(component: any) {
    if (component.leaderboardModal) component.leaderboardModal.nativeElement.style.display = "block";
    if (component.leaderboardOverlay) component.leaderboardOverlay.nativeElement.style.display = "block";
    setLeaderboardType(component, 'sonics', component.homeService);
}

export function closeLeaderboard(component: any) {
    if (component.leaderboardModal) component.leaderboardModal.nativeElement.style.display = "none";
    if (component.leaderboardOverlay) component.leaderboardOverlay.nativeElement.style.display = "none";
}

// ВЫБОР ТИПА ЛЕДЕРБОРДА //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function setLeaderboardType(component: any, type: 'sonics' | 'referrals' | 'spentNFT', homeService: HomeService) {
    component.leaderboardType = type;
    loadLeaderboardData(component, type, homeService);
}

// ЗАГРУЗКА ДЫННЫХ ЛИДЕРБОРДА //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function loadLeaderboardData(component: any, type: 'sonics' | 'referrals' | 'spentNFT', homeService: HomeService) {
    let observable: Observable<LeaderboardResponse>;
    switch (type) {
        case 'sonics':
            observable = homeService.getLeaderboardSonics();
            break;
        case 'referrals':
            observable = homeService.getLeaderboardReferrals();
            break;
        case 'spentNFT':
            observable = homeService.getLeaderboardSpentNFT();
            break;
    }

    observable.subscribe(
        (response: LeaderboardResponse) => {
            component.leaderboardData = response.leaderboard.map(entry => ({
                ...entry,
                name: entry.name?.toString() || 'Unknown',
                score: entry.sonic_balance || entry.referral_count || entry.spent_on_nft || 0
            }));
            const userEntry = component.leaderboardData.find((entry: LeaderboardEntry) => entry.user_id === component.currentUserId);
            if (userEntry) {
                component.userRank = userEntry.rank;
            }
        },
    );
}

// КОПИРОВАНИЕ РЕФКИ //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function copyReferralLink(referralLink: string, telegramService: TelegramService) {
    navigator.clipboard.writeText(referralLink).then(() => {
        if (telegramService.isTelegramWebAppAvailable()) {
            telegramService.showAlert('Referral link copied to clipboard!');
        } else {
            console.warn('Telegram WebApp is not available');
        }
    }, (err) => {
        if (telegramService.isTelegramWebAppAvailable()) {
            telegramService.showAlert('Failed to copy referral link. Please try again.');
        } else {
            console.warn('Telegram WebApp is not available');
        }
    });
}

// ПОЛУЧЕНИЕ ЦЕНЫ ТОКЕНА //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function getCurrentPrice(component?: any): Promise<number | null> {
    const apiUrl = 'https://pro-api.coingecko.com/api/v3/simple/price?ids=harrypotterobamasonic10in&vs_currencies=usd';
    const apiKey = 'CG-4bxNeYA1yhCsz7N2mZsd3LGN'; // Замените на ваш Pro API ключ

    return fetch(apiUrl, {
        headers: {
            'x-cg-pro-api-key': apiKey
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data && data.harrypotterobamasonic10in && data.harrypotterobamasonic10in.usd !== undefined) {
            return data.harrypotterobamasonic10in.usd;
        } else {
            console.error('Unexpected data structure:', data);
            return null;
        }
    })
    .catch(error => {
        console.error('Error fetching current price:', error.message);
        return null;
    });
}

// ВЫБОР СКИНА //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function selectSkinById(component: any, id: number) {
    const currentNft = component.cachedNft.nft || DEFAULT_NFT;

    if (currentNft.nft_id === id) {
        const skin = SKINS.find(s => s.id === id);
        if (skin) {
            component.selectedSkin = skin;
            component.currentImage = skin.image1;
        } else {
            component.selectedSkin = SKINS[0];
            component.currentImage = component.selectedSkin.image1;
        }
    } else {
        getCachedNft(component, component.homeService).subscribe(
            (cachedNft: CachedNft) => {
                const fetchedNft = cachedNft.nft || DEFAULT_NFT;
                if (fetchedNft.nft_id === id) {
                    const skin = SKINS.find(s => s.id === id);
                    if (skin) {
                        component.selectedSkin = skin;
                        component.currentImage = skin.image1;
                    } else {
                        component.selectedSkin = SKINS[0];
                        component.currentImage = component.selectedSkin.image1;
                    }
                } else {
                    console.warn(`NFT with id ${id} not found in cache`);
                }
            },
            error => console.error('Error fetching NFT:', error)
        );
    }
}

// КНОПКА ИГРЫТЬ //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function handlePlayClick(component: any, homeService: HomeService, router: Router, telegramService: TelegramService): void {
    const currentNft = component.cachedNft.nft || DEFAULT_NFT;
    homeService.playGame().subscribe(
        response => {
            if (response.can_game) {
                router.navigate(['/game'], { state: { score_per_tap: currentNft.score_per_tap } });
            } else {
                if (telegramService.isTelegramWebAppAvailable()) {
                    telegramService.showAlert('You can only play once per day. Please try again later.');
                } else {
                    console.warn('Telegram WebApp is not available');
                }
            }
        },
        error => {
            if (error.status === 400 && error.error.detail) {
                alert(error.error.detail);
            } else {
                if (telegramService.isTelegramWebAppAvailable()) {
                    telegramService.showAlert('You can only play once per day. Please try again later!!!');
                } else {
                    console.warn('Telegram WebApp is not available');
                }
            }
        }
    );
}

// ПОЛУЧЕНИЕ РЕФКИ ЮЗЕРА //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function getReferralLink(component: any, homeService: HomeService) {
    homeService.getReferralLink().subscribe(
        link => {
            component.referralLink = link;
            component.qrCodeUrl = generateQRCode(link);
        },
        error => console.error('Error fetching referral link:', error)
    );
}

// ПОЛУЧЕНИЕ БАЛАНСА ЮЗЕРА //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function getBalance(component: any, homeService: HomeService) {
    homeService.getUserBalance().subscribe(
        balance => {
            component.balance = balance;
            homeService.updateBalance(balance);
        },
        error => console.error('Ошибка при получении баланса:', error)
    );
}

// ГЕНЕРИТ QR КОД //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function generateQRCode(data: string): string {
    return 'https://api.qrserver.com/v1/create-qr-code/?data=' + encodeURIComponent(data);
}