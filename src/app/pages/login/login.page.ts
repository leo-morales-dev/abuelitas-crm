import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.css']  // ✅ Enlace al archivo de estilos
})
export class LoginPage implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  ngOnInit(): void {
    this.auth.user$.subscribe(user => {
      if (user) {
        this.router.navigate(['/']);
      }
    });
  }

  onLogin() {
    if (this.form.invalid) return;

    const { email, password } = this.form.value;
    this.auth.login(email!, password!)
      .then(() => this.router.navigate(['/']))
      .catch(err => alert('Error al iniciar sesión: ' + err.message));
  }
}
