import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsAndNutrientsComponent } from './products-and-nutrients.component';

describe('ProductsAndNutrientsComponent', () => {
  let component: ProductsAndNutrientsComponent;
  let fixture: ComponentFixture<ProductsAndNutrientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductsAndNutrientsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsAndNutrientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
