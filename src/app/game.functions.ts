import { ElementRef } from '@angular/core';
import { GameComponentInterface } from '../app/services/interfaces';
// import { AuthService } from '../app/services/auth.service';
import { GameService } from '../app/services/game.service';

import { getScorePerTap, DEFAULT_NFT } from './home.functions';

export function initGame(component: GameComponentInterface, sonicElement: ElementRef, updateScore: () => void, updateGroundPosition: () => void) {
    component.score = 0;
    component.gameSpeed = 1;
    const currentNft = component.cachedNft.nft || DEFAULT_NFT;
    component.points = getScorePerTap(currentNft);
    component.backgroundPosition = 0;
    component.groundPosition = 0;
    component.collectedCoins = 0;
    component.isGameOver = false;

    sonicElement.nativeElement.style.bottom = '12vh';
    updateScore();
    updateGroundPosition();
}

export function createObstacle(gameElement: ElementRef, sonicElement: ElementRef, isGameOver: boolean) {
    if (isGameOver) return;

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

    const sonicRect = sonicElement.nativeElement.getBoundingClientRect();
    const gameRect = gameElement.nativeElement.getBoundingClientRect();
    const spawnPosition = sonicRect.right - gameRect.left + 150;

    obstacle.style.left = `${spawnPosition}px`;
    obstacle.style.position = 'absolute';
    obstacle.style.zIndex = '10';
    gameElement.nativeElement.appendChild(obstacle);
}

export function createCoin(gameElement: ElementRef, sonicElement: ElementRef, isGameOver: boolean) {

    if (isGameOver) return;

    const coin = document.createElement('img');
    coin.style.left = '100%';
    coin.classList.add('coin');
    coin.src = '../../../assets/images/icons/mybank_coin.png';
    coin.style.width = '5vw';
    coin.style.height = 'auto';

    const sonicRect = sonicElement.nativeElement.getBoundingClientRect();
    const gameRect = gameElement.nativeElement.getBoundingClientRect();
    const spawnPosition = sonicRect.right - gameRect.left + 150;

    coin.style.left = `${spawnPosition}px`;
    coin.style.bottom = `${15 + Math.random() * 15}vh`;
    coin.style.position = 'absolute';
    coin.style.zIndex = '15';
    gameElement.nativeElement.appendChild(coin);
}

export function moveElements(component: GameComponentInterface, gameElement: ElementRef, sonicElement: ElementRef, updateScore: () => void): boolean | null {
    const elements = gameElement.nativeElement.querySelectorAll('.obstacle, .coin');
    
    for (const element of elements) {
      const elementLeft = parseFloat(element.style.left);
      if (elementLeft > -10) {
        element.style.left = `${elementLeft - component.gameSpeed}%`;
      } else {
        element.remove();
      }
  
      if (checkCollision(sonicElement.nativeElement, element)) {
        if (element.classList.contains('coin')) {
          component.collectedCoins++;
          component.score += component.points;
          updateScore();
          element.remove();
          if (component.collectedCoins >= component.maxCoins) {
            return true; // Game over (win)
          }
        } else {
          return false; // Game over (lose)
        }
      }
    }
    
    return null; // Game continues
  }

export function checkCollision(a: HTMLElement, b: HTMLElement) {
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();
    return !(aRect.bottom < bRect.top || aRect.top > bRect.bottom ||
        aRect.right < bRect.left || aRect.left > bRect.right);
}

export function moveGround(component: GameComponentInterface, ground: ElementRef) {
    component.groundPosition -= component.gameSpeed * 3;
    if (component.groundPosition <= -window.innerWidth) {
        component.groundPosition += window.innerWidth;
    }
    ground.nativeElement.style.backgroundPositionX = `${component.groundPosition}px`;
}

export function gameOver(component: GameComponentInterface, authService: GameService, finalScoreDisplay: ElementRef, gameOverModal: ElementRef, isWin: boolean) {
    component.isGameOver = true;
    const message = isWin ? 'You Winner!' : 'Game over!';

    authService.submitGameResult(component.score, isWin).subscribe(
        response => {
            console.log('Game result submitted successfully:', response);
            finalScoreDisplay.nativeElement.textContent = `${message} Your coins: ${component.score}`;
            gameOverModal.nativeElement.style.display = 'block';

            if (response.new_balance !== undefined) {
                // Здесь можно добавить логику обновления отображаемого баланса
            }
        },
        error => {
            console.error('Error submitting game result:', error);
            finalScoreDisplay.nativeElement.textContent = `${message} Your coins: ${component.score} (Error saving result)`;
            gameOverModal.nativeElement.style.display = 'block';
        }
    );
}

export function jump(component: GameComponentInterface, sonicElement: ElementRef) {
    if (!component.isJumping && !component.isGameOver) {
        component.isJumping = true;
        let jumpCount = 0;
        const jumpHeight = 1.5;
        const jumpInterval = setInterval(() => {
            const currentBottom = parseFloat(sonicElement.nativeElement.style.bottom) || 13;
            if (jumpCount < 10) {
                sonicElement.nativeElement.style.bottom = `${currentBottom + jumpHeight}vh`;
            } else if (jumpCount < 20) {
                sonicElement.nativeElement.style.bottom = `${currentBottom - jumpHeight}vh`;
            } else {
                clearInterval(jumpInterval);
                component.isJumping = false;
                sonicElement.nativeElement.style.bottom = '13vh';
            }
            jumpCount++;
        }, 50);
    }
}

export function animateSonic(component: GameComponentInterface, sonicElement: ElementRef) {
    component.frameCount++;
    if (component.frameCount % component.animationSpeed === 0) {
        component.sonicFrame = (component.sonicFrame + 1) % component.sonicFrames.length;
        if (sonicElement && sonicElement.nativeElement) {
            sonicElement.nativeElement.src = component.sonicFrames[component.sonicFrame];
        }
    }
}

export function preloadImages(component: GameComponentInterface) {
    component.sonicFrames.forEach((src, index) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            component.cachedImages[index] = img;
            if (index === 0) {
                component.currentSonicElement = img.cloneNode() as HTMLImageElement;
                component.nextSonicElement = img.cloneNode() as HTMLImageElement;
            }
        };
    });
}

export function initSonicElements(component: GameComponentInterface, sonicElement: ElementRef) {
    component.currentSonicElement.style.position = 'absolute';
    component.nextSonicElement.style.position = 'absolute';
    component.nextSonicElement.style.opacity = '0';

    sonicElement.nativeElement.appendChild(component.currentSonicElement);
    sonicElement.nativeElement.appendChild(component.nextSonicElement);
}

export function gameLoop(component: GameComponentInterface, gameElement: ElementRef, sonicElement: ElementRef, ground: ElementRef, updateScore: () => void): void {
    if (component.isGameOver) return;

    const gameOverStatus = moveElements(component, gameElement, sonicElement, updateScore);
    if (gameOverStatus !== null) {
        component.isGameOver = true;
        return;
    }
    
    moveGround(component, ground);
    animateSonic(component, sonicElement);

    component.backgroundPosition -= component.gameSpeed;
    if (component.backgroundPosition <= -window.innerWidth) {
        component.backgroundPosition = 0;
    }
    gameElement.nativeElement.style.backgroundPositionX = `${component.backgroundPosition}px`;

    requestAnimationFrame(() => gameLoop(component, gameElement, sonicElement, ground, updateScore));
}

