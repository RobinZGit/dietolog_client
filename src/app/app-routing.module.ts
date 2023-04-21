import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductsAndNutrientsComponent } from './products-and-nutrients/products-and-nutrients.component';

const routes: Routes = [{path:'',component: ProductsAndNutrientsComponent}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
