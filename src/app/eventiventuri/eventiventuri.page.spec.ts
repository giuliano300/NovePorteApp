import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EventiventuriPage } from './eventiventuri.page';

describe('EventiventuriPage', () => {
  let component: EventiventuriPage;
  let fixture: ComponentFixture<EventiventuriPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventiventuriPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventiventuriPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
