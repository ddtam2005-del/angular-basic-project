import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Detail1 } from './detail1';

describe('Detail1', () => {
  let component: Detail1;
  let fixture: ComponentFixture<Detail1>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Detail1],
    }).compileComponents();

    fixture = TestBed.createComponent(Detail1);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
