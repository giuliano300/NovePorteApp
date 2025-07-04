import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EventiPage } from './eventi.page';

describe('EventiPage', () => {
  let component: EventiPage;
  let fixture: ComponentFixture<EventiPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventiPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
