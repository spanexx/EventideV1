import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Register all chart types
Chart.register(...registerables);

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnInit {
  @Input() title: string = '';
  @Input() data: any[] = [];
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef;
  
  private chart: Chart | undefined;
  
  ngOnInit(): void {
    this.renderChart();
  }
  
  ngOnChanges(): void {
    this.renderChart();
  }
  
  private renderChart(): void {
    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Prepare data for Chart.js
    const labels = this.data.map(item => {
      if (item.date) {
        return new Date(item.date).toLocaleDateString();
      }
      return '';
    });
    
    const values = this.data.map(item => {
      if (item.amount !== undefined) {
        return item.amount;
      }
      if (item.rate !== undefined) {
        return item.rate;
      }
      if (item.count !== undefined) {
        return item.count;
      }
      return 0;
    });
    
    // Create chart configuration
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
    
    // Create the chart
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    this.chart = new Chart(ctx, config);
  }
}