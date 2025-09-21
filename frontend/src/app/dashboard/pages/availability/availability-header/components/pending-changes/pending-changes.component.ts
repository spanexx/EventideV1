import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-pending-changes-indicator',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './pending-changes.component.html',
  styleUrls: ['./pending-changes.component.scss']
})
export class PendingChangesIndicatorComponent {
  @Input() pendingChangesCount: number = 0;
}