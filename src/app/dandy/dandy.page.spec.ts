import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DandyPage } from './dandy.page';

describe('DandyPage', () => {
  let component: DandyPage;
  let fixture: ComponentFixture<DandyPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DandyPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DandyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
