import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PortePage } from './porte.page';

describe('PortePage', () => {
  let component: PortePage;
  let fixture: ComponentFixture<PortePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PortePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PortePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
