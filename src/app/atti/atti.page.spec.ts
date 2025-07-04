import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AttiPage } from './atti.page';

describe('AttiPage', () => {
  let component: AttiPage;
  let fixture: ComponentFixture<AttiPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttiPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AttiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
