import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FortezzaService } from './fortezza.service';

@Component({
  selector: 'app-fortezza',
  templateUrl: './fortezza.page.html',
  styleUrls: ['./fortezza.page.scss'],
})
export class FortezzaPage implements OnInit {
  loginModel = { password: '' };
  r: boolean | undefined;
  isLoggedIn = false;
  constructor(private router: Router, public alertController: AlertController, private fortezzaService: FortezzaService) {
    if (localStorage.getItem("loggedIn") !== null) {
      this.router.navigate(['fortezzadet']);
    } 
  }

  
  
  ngOnInit() {
    if (localStorage.getItem("loggedIn") == null) {
      let fortezza = document.getElementById("fortezza");
      if(fortezza != null)
        fortezza.style.display = "block";
    } 
  }

  async presentAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Nove porte',
      message: message,
      buttons: ['chiudi']
    });

    await alert.present();
  }

  login(){
    this.fortezzaService.login(this.loginModel.password).subscribe(
      (response: any) => {
        this.r = JSON.parse(JSON.stringify(response));
        if(!this.r)
          this.presentAlert('Password errata');
        else{
            localStorage.setItem('loggedIn', "true");
            this.router.navigate(['fortezzadet']);
        }
     });
  }
}