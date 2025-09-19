import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SmartCalendarComponent } from './smart-calendar.component';
import { MonthlyViewSmartComponent } from './monthly-view/monthly-view-smart.component';
import { WeeklyViewSmartComponent } from './weekly-view/weekly-view-smart.component';
import { DailyViewSmartComponent } from './daily-view/daily-view-smart.component';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    SmartCalendarComponent,
    MonthlyViewSmartComponent,
    WeeklyViewSmartComponent,
    DailyViewSmartComponent
  ],
  exports: [
    SmartCalendarComponent,
    MonthlyViewSmartComponent,
    WeeklyViewSmartComponent,
    DailyViewSmartComponent
  ]
})
export class SmartCalendarModule { }