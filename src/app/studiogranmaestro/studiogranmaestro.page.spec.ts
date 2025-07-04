import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StudiogranmaestroPage } from './studiogranmaestro.page';

describe('StudiogranmaestroPage', () => {
  let component: StudiogranmaestroPage;
  let fixture: ComponentFixture<StudiogranmaestroPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StudiogranmaestroPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(StudiogranmaestroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
