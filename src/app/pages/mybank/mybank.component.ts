import { Component, ElementRef, ViewChild, Renderer2, OnInit, OnDestroy, ViewEncapsulation, HostListener } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { throwError, Subscription, Observable } from 'rxjs';
import { Chart, registerables, ChartType, ChartConfiguration } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import zoomPlugin from 'chartjs-plugin-zoom';
import { AuthService } from '../../services/auth.service';
import { TelegramService } from '../../services/telegram.service';
import { catchError, tap, retry } from 'rxjs/operators';
import { ExchangeRatesService } from '../../services/exchange-rates.service';

Chart.register(...registerables, zoomPlugin);

interface CustomTimeScale {
  unit: 'hour' | 'day' | 'week' | 'month';
  displayFormats: {
    [key: string]: string;
  };
  stepSize?: number;
}

interface ExchangeRates {
  harry_price_usd: number;
  ton_to_harry: number;
  usdt_to_harry: number;
  harry_historical: {
    "1d": HistoricalData;
    "7d": HistoricalData;
    "30d": HistoricalData;
    "90d": HistoricalData;
    "365d": HistoricalData;
    max: HistoricalData;
  };
  updated_at: string;
}

interface HistoricalData {
  prices: number[][];
  market_caps: number[][];
  total_volumes: number[][];
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

  @HostListener('document:touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    if (this.modal && !this.modal.nativeElement.contains(event.target as Node)) {
      this.closeKeyboard();
    }
  }

  private resizeListener: (() => void) | null = null;

  harry_price_usd: number | undefined;

  withdrawAddress: string = '';
  isAddressValid: boolean = false;
  balance: number = 0;
  referralBalance: number = 0;
  withdrawAmount: number = 0;
  paymentSystem: string = 'BEP-20';
  private chartDataCache: { [key: string]: any } = {};
  private updateCacheInterval: any;

  private chart: Chart | null = null;
  private chartDataSubscription: Subscription | null = null;

  constructor(
    private renderer: Renderer2,
    private http: HttpClient,
    private authService: AuthService,
    private telegramService: TelegramService,
    private exchangeRatesService: ExchangeRatesService

  ) {
    this.authService.balance$.subscribe(balance => this.balance = balance);
    this.authService.referralBalance$.subscribe(balance => this.referralBalance = balance);
  }

  closeKeyboard() {
    const tmp = document.createElement('input');
    document.body.appendChild(tmp);
    tmp.focus();
    document.body.removeChild(tmp);
    const inputs = this.modal.nativeElement.querySelectorAll('input');
    inputs.forEach((input: HTMLInputElement) => input.blur());
  }

  ngOnInit() {
    this.getBalance();
    this.getReferalBalance();
    this.fetchChartData('7d');

    this.updateCacheInterval = setInterval(() => {
      this.updateChartDataCache();
    }, 2 * 60 * 1000);
  }

  updateChartDataCache() {
    Object.keys(this.chartDataCache).forEach(range => {
      this.fetchChartData(range);
    });
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

  fetchChartData(range: string) {
    if (this.chartDataCache[range]) {
      console.log('Using cached chart data for range:', range);
      this.createChart(this.chartDataCache[range]);
      return;
    }

    this.exchangeRatesService.getExchangeRates().subscribe(
      (data: ExchangeRates) => {
        const chartData = this.processHistoricalData(data.harry_historical, range);
        this.chartDataCache[range] = chartData;
        this.createChart(chartData);
      },
      (error) => {
        console.error('Error fetching chart data:', error);
      }
    );
  }

  private processHistoricalData(historicalData: ExchangeRates['harry_historical'], range: string) {
    if (!(range in historicalData)) {
      console.warn('Range not found in historical data:', range);
      return { prices: [], total_volumes: [] };
    }

    const rangeData = historicalData[range as keyof ExchangeRates['harry_historical']];

    if (!rangeData || !rangeData.prices || !rangeData.total_volumes) {
      console.warn('Invalid data for range:', range);
      return { prices: [], total_volumes: [] };
    }

    return {
      prices: rangeData.prices,
      total_volumes: rangeData.total_volumes
    };
  }

  clearChartDataCache() {
    this.chartDataCache = {};
    console.log('Chart data cache cleared');
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
      } else {
        console.error('Failed to get canvas context');
      }
    } else {
      console.error('Cannot create chart. Invalid data or missing canvas.');
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

  checkAddress() {
    this.isAddressValid = this.withdrawAddress.trim().length > 0;
  }

  withdrawAll() {
    this.withdrawAmount = this.referralBalance;
  }

  submitWithdraw() {
    if (this.withdrawAmount <= this.referralBalance) {
      const withdrawData = {
        payment_system: this.paymentSystem,
        withdraw_amount: this.withdrawAmount,
        withdraw_address: this.withdrawAddress
      };

      if (this.telegramService.isTelegramWebAppAvailable()) {
        this.telegramService.showAlert('Expect payment within 24 hours while we review your transaction');
        this.closeModal();
      } else {
        this.telegramService.showAlert('Telegram WebApp is not available');
      }

      this.authService.withdrawFunds(withdrawData).subscribe(
        () => {
          this.getReferalBalance();
        },
        (error) => {
          console.error('Error withdrawing funds:', error);
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
    if (typeof this.resizeListener === 'function') {
      this.resizeListener();
    }

    if (this.updateCacheInterval) {
      clearInterval(this.updateCacheInterval);
    }
  }
}