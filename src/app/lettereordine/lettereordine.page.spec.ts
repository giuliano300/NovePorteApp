import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { LettereordinePage } from './lettereordine.page';

describe('LettereordinePage', () => {
  let component: LettereordinePage;
  let fixture: ComponentFixture<LettereordinePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LettereordinePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(LettereordinePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
