import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ AÑADIR ESTO

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule], // ✅ AÑADIR FormsModule
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.css']
})
export class LoginPage implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  recordarUsuario = false; // ✅ ESTA PROPIEDAD ES LA QUE USA NGMODEL

  ngOnInit(): void {
    const savedEmail = localStorage.getItem('crm_email');
    if (savedEmail) {
      this.form.patchValue({ email: savedEmail });
      this.recordarUsuario = true;
    }

    this.auth.user$.subscribe(user => {
      if (user) this.router.navigate(['/']);
    });
  }

  onLogin() {
    if (this.form.invalid) return;

    const { email, password } = this.form.value;

    if (this.recordarUsuario && email) {
      localStorage.setItem('crm_email', email);
    } else {
      localStorage.removeItem('crm_email');
    }

    this.auth.login(email!, password!)
      .then(() => this.router.navigate(['/']))
      .catch(err => alert('Error al iniciar sesión: ' + err.message));
  }
}
