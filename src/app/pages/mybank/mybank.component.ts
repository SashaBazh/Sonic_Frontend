import { Component, ElementRef, ViewChild, Renderer2, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError, Subscription } from 'rxjs';
import { Chart, registerables, ChartType, ChartConfiguration} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import zoomPlugin from 'chartjs-plugin-zoom';
import { AuthService } from '../../services/auth.service';

Chart.register(...registerables, zoomPlugin);

interface CustomTimeScale {
  unit: 'hour' | 'day' | 'week' | 'month';
  displayFormats: {
    [key: string]: string;
  };
  stepSize?: number;
}

@Component({
  selector: 'app-mybank',
  templateUrl: './mybank.component.html',
  styleUrls: ['./mybank.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MybankComponent implements OnInit, OnDestroy {
  @ViewChild('modal') modal!: ElementRef<HTMLElement>;
  @ViewChild('overlay') overlay!: ElementRef<HTMLElement>;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('myCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private resizeListener: (() => void) | null = null;

  withdrawAddress: string = '';
  isAddressValid: boolean = false;
  balance: number = 0;
  referralBalance: number = 0;
  withdrawAmount: number = 0;
  paymentSystem: string = 'BEP-20';

  private chart: Chart | null = null;
  private chartDataSubscription: Subscription | null = null;

  constructor(
    private renderer: Renderer2,
    private http: HttpClient,
    private authService: AuthService,
    
  ) {
    this.authService.balance$.subscribe(balance => this.balance = balance);
    this.authService.referralBalance$.subscribe(balance => this.referralBalance = balance);
  }

  ngOnInit() {
    this.getBalance();
    this.getReferalBalance();
    this.fetchChartData('30');
  }

  ngAfterViewInit() {
    // this.adjustCanvasWidth();
    // this.resizeListener = this.renderer.listen('window', 'resize', () => this.adjustCanvasWidth());
    // this.modal.nativeElement.addEventListener('touchstart', (e: TouchEvent) => {
    //   if (e.target === this.modal.nativeElement) {
    //     document.activeElement.blur();
    //   }
    // });
  }

  adjustCanvasWidth() {
    const container = document.querySelector('.mybank_info_contanier') as HTMLElement;
    const canvas = this.canvasRef.nativeElement;
    
    if (container && canvas) {
      const containerWidth = container.offsetWidth;
      this.renderer.setStyle(canvas, 'width', `${containerWidth - 2}px`);
    }
  }


  getBalance() {
    this.authService.getUserBalance().subscribe(
      balance => {
        this.authService.updateBalance(balance);
      },
    );
  }

  getReferalBalance() {
    this.authService.getUserReferralBalance().subscribe(
      referralBalance => {
        this.authService.updateReferralBalance(referralBalance);
      },
    );
  }

  fetchCurrentPrice() {
    const apiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=harrypotterobamasonic10in&vs_currencies=usd,btc,eth&include_24hr_change=true';

    this.http.get(apiUrl).subscribe(
      (data: any) => {
        const coinData = data['harrypotterobamasonic10in'];
      },
      (error) => {
      }
    );
  }
  

  fetchChartData(range: string) {
    let interval: string;
    let days: string = range;

    switch (range) {
      case '1':
        interval = 'daily';
        break;
      case '7':
        interval = 'daily';
        break;
      case '30':
      case '90':
      case '365':
        interval = 'daily';
        break;
      case 'max':
        interval = 'daily';
        break;
      default:
        interval = 'daily';
    }

    const apiUrl = `https://api.coingecko.com/api/v3/coins/harrypotterobamasonic10in/market_chart?vs_currency=usd&days=${days}&interval=${interval}`;

    this.chartDataSubscription?.unsubscribe();

    this.chartDataSubscription = this.http.get(apiUrl).pipe(
      catchError(error => {
        return throwError(() => new Error('Не удалось получить данные'));
      })
    ).subscribe(
      (data: any) => {
        this.createChart(data);
      },
      (error) => {
      }
    );
  }

  getXAxisSettings(labels: Date[]): { time: CustomTimeScale } {
  const range = labels[labels.length - 1].getTime() - labels[0].getTime();
  const days = range / (1000 * 60 * 60 * 24);

  if (days <= 1) {
    return {
      time: {
        unit: 'hour',
        displayFormats: {
          hour: 'HH:mm'
        },
        stepSize: 2
      }
    };
  } else if (days <= 7) {
    return {
      time: {
        unit: 'day',
        displayFormats: {
          day: 'd MMM'
        },
        stepSize: 1
      }
    };
  } else if (days <= 30) {
    return {
      time: {
        unit: 'week',
        displayFormats: {
          week: 'd MMM'
        }
      }
    };
  } else {
    return {
      time: {
        unit: 'month',
        displayFormats: {
          month: 'MMM yyyy'
        }
      }
    };
  }
}

  createChart(data: any) {
    if (this.chartCanvas && data.prices && data.prices.length > 0) {
      const ctx = this.chartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const prices = data.prices.map((item: number[]) => item[1]);
        const labels = data.prices.map((item: number[]) => new Date(item[0]));
        const volumes = data.total_volumes.map((item: number[]) => item[1]);
  
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
  
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
  
        if (this.chart) {
          this.chart.destroy();
        }
  
        const xAxisSettings = this.getXAxisSettings(labels);
  
        const config: ChartConfiguration<ChartType, number[], string> = {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                type: 'line',
                label: 'Price HarryPotterObamaSonic10Inu (BITCOIN)',
                data: prices,
                borderColor: 'rgba(255, 255, 255, 1)',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                pointBackgroundColor: 'rgba(255, 255, 255, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(255, 255, 255, 1)',
                pointRadius: 0,
                pointHoverRadius: 6,
                tension: 0.4,
                yAxisID: 'y'
              },
              {
                type: 'bar',
                label: 'Volume',
                data: volumes,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                yAxisID: 'y1'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: 'index',
            },
            scales: {
              x: {
                type: 'time',
                ...xAxisSettings.time,
                adapters: {
                  date: {
                    locale: enUS
                  }
                },
                ticks: {
                  source: 'auto',
                  maxRotation: 0,
                  autoSkip: true,
                  color: 'white',
                  font: {
                    size: 12,
                    weight: 'bold'
                  }
                }
              },
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: false,
                min: minPrice * 0.9,
                max: maxPrice * 1.1,
                ticks: {
                  callback: function (value) {
                    const numValue = Number(value);
                    if (numValue >= 1) {
                      return numValue.toFixed(2);
                    } else if (numValue >= 0.01) {
                      return numValue.toFixed(4);
                    } else if (numValue >= 0.0001) {
                      return numValue.toFixed(6);
                    } else {
                      return numValue.toExponential(2);
                    }
                  },
                  color: 'white',
                  font: {
                    size: 12,
                    weight: 'bold'
                  }
                },
                grid: {
                  color: 'rgba(200, 200, 200, 0.2)'
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                beginAtZero: true,
                ticks: {
                  color: 'rgba(75, 192, 192, 1)',
                  font: {
                    size: 12,
                    weight: 'bold'
                  }
                },
                grid: {
                  drawOnChartArea: false
                }
              }
            },
            plugins: {
              legend: {
                display: true,
                labels: {
                  color: 'white',
                  font: {
                    size: 10,
                    weight: 'bold'
                  }
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: {
                  size: 12,
                  weight: 'bold'
                },
                bodyFont: {
                  size: 8
                },
                callbacks: {
                  label: function (context) {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.y !== null) {
                      if (context.datasetIndex === 0) {
                        label += '$' + context.parsed.y.toExponential(12);
                      } else {
                        label += '$' + context.parsed.y.toFixed(2);
                      }
                    }
                    return label;
                  },
                  title: function (tooltipItems) {
                    return new Date(tooltipItems[0].parsed.x).toLocaleString('ru-RU', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  }
                }
              },
              zoom: {
                zoom: {
                  wheel: {
                    enabled: true,
                  },
                  pinch: {
                    enabled: true
                  },
                  mode: 'xy',
                },
                pan: {
                  enabled: true,
                  mode: 'xy',
                },
              }
            },
          },
        };
  
        this.chart = new Chart(ctx, config);
      }
    }
  }

  changeTimeRange(range: string) {
    this.fetchChartData(range);
  }

  openModal(event: Event) {
    event.preventDefault();
    this.renderer.setStyle(this.modal.nativeElement, 'display', 'block');
    this.renderer.setStyle(this.overlay.nativeElement, 'display', 'block');
  }

  closeModal() {
    this.renderer.setStyle(this.modal.nativeElement, 'display', 'none');
    this.renderer.setStyle(this.overlay.nativeElement, 'display', 'none');
  }

  onWindowClick(event: Event) {
    if (event.target === this.overlay.nativeElement) {
      this.closeModal();
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (!(event.target as HTMLElement).closest('input')) {
      this.closeKeyboard();
    }
  }

  closeKeyboard() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  checkAddress() {
    this.isAddressValid = this.withdrawAddress.trim().length > 0;
  }

  withdrawAll() {
    this.withdrawAmount = this.referralBalance;
  }

  submitWithdraw() {
    if (this.isAddressValid && this.referralBalance > 0 && this.withdrawAmount > 0) {
      const withdrawData = {
        payment_system: this.paymentSystem,
        withdraw_amount: this.withdrawAmount,
        withdraw_address: this.withdrawAddress
      };
  
      this.authService.withdrawFunds(withdrawData).subscribe(
        (response) => {
          console.log('Withdrawal successful', response);
          this.closeModal();
          this.getReferalBalance(); // Обновляем баланс после успешного вывода
        },
        (error) => {
          console.error('Withdrawal failed', error);
          // Здесь можно добавить обработку ошибки, например, показать уведомление пользователю
        }
      );
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
    if (this.chartDataSubscription) {
      this.chartDataSubscription.unsubscribe();
    }
    if (this.resizeListener) {
      this.resizeListener();
    }

  }
}