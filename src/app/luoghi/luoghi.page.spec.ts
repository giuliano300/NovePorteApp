import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { LuoghiPage } from './luoghi.page';

describe('LuoghiPage', () => {
  let component: LuoghiPage;
  let fixture: ComponentFixture<LuoghiPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LuoghiPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(LuoghiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
