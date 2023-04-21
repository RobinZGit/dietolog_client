import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProductsAndNutrientsComponent } from './products-and-nutrients/products-and-nutrients.component';

@NgModule({
  declarations: [
    AppComponent,
    ProductsAndNutrientsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
