import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [
    BaseChartDirective,
    MatButtonModule,
    MatButtonToggleModule
  ],
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.scss'
})
export class LineChartComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;
  
  @Input() title: string = 'Chart';
  @Input() data: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {},
      y: {
        min: 0
      }
    },
    plugins: {
      legend: {
        display: true,
      }
    }
  };
  
  public lineChartType: ChartType = 'line';

  constructor() { }

  ngOnInit(): void {
  }

  updateChartData(newData: ChartData<'line'>): void {
    this.data = newData;
    if (this.chart) {
      this.chart.update();
    }
  }
}