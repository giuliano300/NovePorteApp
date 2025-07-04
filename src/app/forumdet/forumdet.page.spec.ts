import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ForumdetPage } from './forumdet.page';

describe('ForumdetPage', () => {
  let component: ForumdetPage;
  let fixture: ComponentFixture<ForumdetPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ForumdetPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ForumdetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
