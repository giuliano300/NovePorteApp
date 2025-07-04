import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { email } from 'src/models/Email';
import { RegistroService } from './registro.services';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
})
export class RegistroPage implements OnInit {
  isSubmitted:boolean = false;
  isValid:boolean = false;
  email = new email();
  
  constructor(public fb: FormBuilder, private router: Router,
    private registroService: RegistroService) { }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

    ionicForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      cognome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$')]],
      indirizzo : ['', [Validators.required]],
      citta : ['', [Validators.required]],
      eta : ['', [Validators.required]],
      cellulare : ['', [Validators.required]],
      interessi : ['', [Validators.required]],
      come : ['', [Validators.required]],
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
      this.email.subject = "Email dal registro";
      this.email.body = "Nome: " + this.ionicForm.value.nome + "<br>Cognome: " + this.ionicForm.value.cognome + "<br>Email: " + this.ionicForm.value.email + 
      "<br>Indirizzo:" + this.ionicForm.value.indirizzo + "<br>Citta': " + this.ionicForm.value.citta + "<br>Eta': " + this.ionicForm.value.eta + 
      "<br>Cellulare: " + this.ionicForm.value.cellulare +
      "<br>Interessi<br>" + this.ionicForm.value.interessi +
      "<br>Come ha saputo del Cavalleresco Ordine?<br>" + this.ionicForm.value.come;
     
      this.registroService.sendEmail(this.email).subscribe(
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
