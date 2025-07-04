import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EventodetPage } from './eventodet.page';

describe('EventodetPage', () => {
  let component: EventodetPage;
  let fixture: ComponentFixture<EventodetPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventodetPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventodetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
