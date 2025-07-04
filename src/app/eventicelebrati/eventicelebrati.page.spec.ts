import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EventicelebratiPage } from './eventicelebrati.page';

describe('EventicelebratiPage', () => {
  let component: EventicelebratiPage;
  let fixture: ComponentFixture<EventicelebratiPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventicelebratiPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventicelebratiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
