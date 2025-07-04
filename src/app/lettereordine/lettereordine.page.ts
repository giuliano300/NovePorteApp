import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { email } from 'src/models/Email';
import { LettereOrdineService } from './lettereordine.services';

@Component({
  selector: 'app-lettereordine',
  templateUrl: './lettereordine.page.html',
  styleUrls: ['./lettereordine.page.scss'],
})
export class LettereordinePage implements OnInit {
  isSubmitted:boolean = false;
  isValid:boolean = false;
  email = new email();
  constructor(public fb: FormBuilder, private router: Router,
    private lettereordineService: LettereOrdineService) { }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  ionicForm = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    cognome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$')]],
    testo: ['', [Validators.required]]
  });
  

  get errorControl() {
    return this.ionicForm.controls;
  }

  submitForm(){
    this.isSubmitted = true;
    if (!this.ionicForm.valid) {
       return;
    } 
    else 
    {

      this.email.to = environment.toEmail;
      this.email.subject = "Lettera all'ordine";
      this.email.body = "Nome: " + this.ionicForm.value.nome + "<br>Cognome: " + this.ionicForm.value.cognome + "<br>Email: " + this.ionicForm.value.email + "<br>Testo<br>" + this.ionicForm.value.testo;
     
      this.lettereordineService.sendEmail(this.email).subscribe(
        response => {
          this.isValid = true;
          console.log(response);
        },
        error => {
          console.log('oops', error);
        }
      )
    }
  }
}
