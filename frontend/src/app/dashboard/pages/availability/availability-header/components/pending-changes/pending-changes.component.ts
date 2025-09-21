import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pending-changes-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-changes.component.html',
  styleUrls: ['./pending-changes.component.scss']
})
export class PendingChangesIndicatorComponent {
  @Input() pendingChangesCount: number = 0;
}