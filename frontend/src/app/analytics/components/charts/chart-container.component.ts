import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chart-container',
  templateUrl: './chart-container.component.html',
  styleUrls: ['./chart-container.component.scss'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule]
})
export class ChartContainerComponent {
  @Input() title: string = '';
}