import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.verifyToken().subscribe();
  }
}
