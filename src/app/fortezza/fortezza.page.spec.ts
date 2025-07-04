import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FortezzaPage } from './fortezza.page';

describe('FortezzaPage', () => {
  let component: FortezzaPage;
  let fixture: ComponentFixture<FortezzaPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FortezzaPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FortezzaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
