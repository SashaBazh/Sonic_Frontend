import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyteamComponent } from './myteam.component';

describe('MyteamComponent', () => {
  let component: MyteamComponent;
  let fixture: ComponentFixture<MyteamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyteamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyteamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
