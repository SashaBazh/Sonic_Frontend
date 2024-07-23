import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';;
import { HomeService } from '../../services/home.service';
import { CachedNft } from '../../services/interfaces';
import { initializeComponent } from '../../home.functions';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, AfterViewInit {
  @ViewChild('game') gameElement!: ElementRef;
  @ViewChild('sonic') sonicElement!: ElementRef;
  @ViewChild('scoreDisplay') scoreDisplay!: ElementRef;
  @ViewChild('ground') ground!: ElementRef;
  @ViewChild('gameOverModal') gameOverModal!: ElementRef;
  @ViewChild('finalScoreDisplay') finalScoreDisplay!: ElementRef;
  @ViewChild('restartButton') restartButton!: ElementRef;

  isJumping = false;
  score = 0;
  gameSpeed = 1;
  isGameOver = false;
  gameLoopId: number | undefined;
  maxCoins = 300;
  collectedCoins = 0;
  currentNft: any;
  scorePerTap: number | undefined;


  backgroundPosition = 0;
  groundPosition = 0;

  sonicFrame = 0;
  sonicFrames = [
    '../../../assets/images/Sonic_game1.png',
    '../../../assets/images/Sonic_game2.png',
  ];
  cachedImages: HTMLImageElement[] = [];
  currentSonicElement!: HTMLImageElement;
  nextSonicElement!: HTMLImageElement;

  animationSpeed = 3; 


  constructor(
    private ngZone: NgZone, 
    private router: Router, 
    private authService: AuthService, 
    private homeService: HomeService
  ) { 
    const navigation = this.router.getCurrentNavigation();
  if (navigation && navigation.extras.state) {
    this.scorePerTap = navigation.extras.state['score_per_tap'];
    console.log('Score per tap received:', this.scorePerTap);
  } else {
    console.log('No state received');
  }
  }

  ngOnInit() {

    this.preloadImages();
    initializeComponent(this, this.homeService);

    if (this.scorePerTap === undefined) {
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras.state) {
        this.scorePerTap = navigation.extras.state['score_per_tap'];
        console.log('ngOnInit - Score per tap set:', this.scorePerTap);
      }
    }

  }

  ngAfterViewInit() {
    this.initGame();
    this.gameLoop();
    setInterval(() => this.createObstacle(), 2000);
    setInterval(() => this.createCoin(), 1500);

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        this.jump();
      }
    });

    document.addEventListener('touchstart', () => this.jump());
    this.restartButton.nativeElement.addEventListener('click', () => this.restartGame());
  }

  initGame() {
    this.sonicElement.nativeElement.style.bottom = '12vh';
    this.score = 0;
    this.gameSpeed = 1;
    // this.points = 1;
    this.updateScore();

    this.backgroundPosition = 0;
    this.groundPosition = 0;
    this.updateGroundPosition();
    this.preloadImages();

    if (this.scorePerTap === undefined) {
      this.scorePerTap = 100; // или любое другое значение по умолчанию
      console.log('initGame - Default score per tap set:', this.scorePerTap);
    }
  }

  createObstacle() {
    if (this.isGameOver) return;

    const obstacle = document.createElement('img');
    obstacle.style.left = '100%';
    obstacle.classList.add('obstacle');
    const isBoss1 = Math.random() > 0.5;
    obstacle.src = isBoss1 ? '../../../assets/images/Boss1.png' : '../../../assets/images/Boss2.png';

    if (isBoss1) {
      obstacle.style.width = '20vw';
      obstacle.style.bottom = '30vh';
    } else {
      obstacle.style.width = '10vw';
      obstacle.style.bottom = '14vh';
    }

    obstacle.style.height = 'auto';

    // Вычисляем позицию для спавна
    const sonicRect = this.sonicElement.nativeElement.getBoundingClientRect();
    const gameRect = this.gameElement.nativeElement.getBoundingClientRect();
    const spawnPosition = sonicRect.right - gameRect.left + 150;

    obstacle.style.left = `${spawnPosition}px`;
    obstacle.style.position = 'absolute';
    obstacle.style.zIndex = '10';
    this.gameElement.nativeElement.appendChild(obstacle);
  }

  createCoin() {

    if (this.isGameOver) return;

    const coin = document.createElement('img');
    coin.style.left = '100%';
    coin.classList.add('coin');
    coin.src = '../../../assets/images/icons/mybank_coin.png';
    coin.style.width = '5vw';
    coin.style.height = 'auto';

    // Вычисляем позицию для спавна
    const sonicRect = this.sonicElement.nativeElement.getBoundingClientRect();
    const gameRect = this.gameElement.nativeElement.getBoundingClientRect();
    const spawnPosition = sonicRect.right - gameRect.left + 150;

    coin.style.left = `${spawnPosition}px`;
    coin.style.bottom = `${15 + Math.random() * 15}vh`;
    coin.style.position = 'absolute';
    coin.style.zIndex = '15';
    this.gameElement.nativeElement.appendChild(coin);
  }

  moveElements() {
    const elements = this.gameElement.nativeElement.querySelectorAll('.obstacle, .coin');
    elements.forEach((element: HTMLElement) => {
      const elementLeft = parseFloat(element.style.left);
      if (elementLeft > -10) {  // Удаляем элемент, когда он полностью ушел за левый край
        element.style.left = `${elementLeft - this.gameSpeed}%`;
      } else {
        element.remove();
      }

      if (this.checkCollision(this.sonicElement.nativeElement, element)) {
        if (element.classList.contains('coin')) {
          this.collectedCoins++;
          this.score += this.scorePerTap ?? 80; // Используем scorePerTap или 1, если scorePerTap не определено
          this.updateScore();
          element.remove();
          if (this.collectedCoins >= this.maxCoins) {
            this.gameOver(true);
          }
        } else {
          this.gameOver(false);
        }
      }
    });
  }

  checkCollision(a: HTMLElement, b: HTMLElement) {
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();
    return !(aRect.bottom < bRect.top || aRect.top > bRect.bottom ||
      aRect.right < bRect.left || aRect.left > bRect.right);
  }

  moveGround() {
    this.groundPosition -= this.gameSpeed * 3;
    if (this.groundPosition <= -window.innerWidth) {
      this.groundPosition += window.innerWidth;
    }
    this.updateGroundPosition();
  }

  updateGroundPosition() {
    this.ground.nativeElement.style.backgroundPositionX = `${this.groundPosition}px`;
  }

  gameOver(isWin: boolean) {
    this.isGameOver = true;
    const message = isWin ? 'You Winner!' : 'Game over!';
    
    this.authService.submitGameResult(this.score, isWin).subscribe(
      response => {
        console.log('Game result submitted successfully:', response);
        this.finalScoreDisplay.nativeElement.textContent = `${message} Your coins: ${this.score}.`;
        this.gameOverModal.nativeElement.style.display = 'block';
        
        if (response.new_balance !== undefined) {
          this.updateDisplayedBalance(response.new_balance);
        }
      },
      error => {
        console.error('Error submitting game result:', error);
        this.finalScoreDisplay.nativeElement.textContent = `${message} Your coins: ${this.score}. (Error saving result)`;
        this.gameOverModal.nativeElement.style.display = 'block';
      }
    );
  }
  
  // Добавьте этот метод, если у вас его еще нет
  private updateDisplayedBalance(newBalance: number) {
    // Обновите отображаемый баланс в вашем компоненте
    // Например:
    // this.displayedBalance = newBalance;
  }

  restartGame() {
    this.isGameOver = false;
    this.collectedCoins = 0;
    this.gameElement.nativeElement.querySelectorAll('.obstacle, .coin').forEach((el: Element) => el.remove());
    this.initGame();
    this.gameOverModal.nativeElement.style.display = 'none';
    this.gameLoop();
  }

  jump() {
    if (!this.isJumping && !this.isGameOver) {
      this.isJumping = true;
      let jumpCount = 0;
      const jumpHeight = 1.5;
      const jumpInterval = setInterval(() => {
        const currentBottom = parseFloat(this.sonicElement.nativeElement.style.bottom) || 13;
        if (jumpCount < 10) {
          this.sonicElement.nativeElement.style.bottom = `${currentBottom + jumpHeight}vh`;
        } else if (jumpCount < 20) {
          this.sonicElement.nativeElement.style.bottom = `${currentBottom - jumpHeight}vh`;
        } else {
          clearInterval(jumpInterval);
          this.isJumping = false;
          this.sonicElement.nativeElement.style.bottom = '13vh';
        }
        jumpCount++;
      }, 50);
    }
  }

  frameCount = 0;
  flag: boolean = false;

  animateSonic() {
    this.frameCount++;
    if (this.frameCount % this.animationSpeed === 0) {
      this.sonicFrame = (this.sonicFrame + 1) % this.sonicFrames.length;
      if (this.sonicElement && this.sonicElement.nativeElement) {
        this.sonicElement.nativeElement.src = this.sonicFrames[this.sonicFrame];
      }
    }
    // if(this.flag){
    //   this.sonicElement.nativeElement.src = this.sonicFrames[0];
    // } else {
    //   this.sonicElement.nativeElement.src = this.sonicFrames[1];
    // }
    // this.flag = !this.flag;
  }

  updateScore() {
    this.scoreDisplay.nativeElement.textContent = `Score: ${this.score}`;
  }

  preloadImages() {
    this.sonicFrames.forEach((src, index) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.cachedImages[index] = img;
        if (index === 0) {
          this.currentSonicElement = img.cloneNode() as HTMLImageElement;
          this.nextSonicElement = img.cloneNode() as HTMLImageElement;
          this.initSonicElements();
        }
      };
    });
  }

  initSonicElements() {
    this.currentSonicElement.style.position = 'absolute';
    this.nextSonicElement.style.position = 'absolute';
    this.nextSonicElement.style.opacity = '0';
    
    this.sonicElement.nativeElement.appendChild(this.currentSonicElement);
    this.sonicElement.nativeElement.appendChild(this.nextSonicElement);
  }

  gameLoop() {
    if (!this.isGameOver) {
      this.moveElements();
      this.moveGround();
      this.animateSonic();
      // Удаляем строку, которая увеличивала скорость игры
      // this.gameSpeed += 0.001;
      this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }

    this.backgroundPosition -= this.gameSpeed;
    if (this.backgroundPosition <= -window.innerWidth) {
      this.backgroundPosition = 0;
    }
    this.gameElement.nativeElement.style.backgroundPositionX = `${this.backgroundPosition}px`;
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}