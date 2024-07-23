import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-myteam',
  templateUrl: './myteam.component.html',
  styleUrl: './myteam.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class MyteamComponent implements OnInit  {
  totalMembers: number = 0;
  totalReferrals: number = 0;
  totalreferralBalance: number = 0;
  referralEnergy: number = 0;

  constructor(
    private authService: AuthService
  ) { 
    this.authService.totalMembers$.subscribe(total => this.totalMembers = total);
    this.authService.totalReferrals$.subscribe(total => this.totalReferrals = total);
    this.authService.totalreferralBalance$.subscribe(balance => this.totalreferralBalance = balance);
    this.authService.referralEnergy$.subscribe(energy => this.referralEnergy = energy);
  }

  ngOnInit() {
    this.getTotalMembers();
    this.getReferralsCount();
    this.gettotalReferalBalance();
    this.getReferralEnergy();
  }

  getReferralEnergy() {
    this.authService.getReferralEnergy().subscribe(
      energy => {
        this.referralEnergy = energy;
      },
    );
  }

  gettotalReferalBalance() {
    this.authService.getUserTotalReferralBalance().subscribe(
      referralBalance => {
        this.totalreferralBalance = referralBalance;
      },
    );
  }

  getTotalMembers() {
    this.authService.getTotalMembers().subscribe(
    );
  }

  getReferralsCount() {
    this.authService.getReferralsCount().subscribe(
    );
  }
}