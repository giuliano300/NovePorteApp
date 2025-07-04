import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FortezzadetPage } from './fortezzadet.page';

describe('FortezzadetPage', () => {
  let component: FortezzadetPage;
  let fixture: ComponentFixture<FortezzadetPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FortezzadetPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FortezzadetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
