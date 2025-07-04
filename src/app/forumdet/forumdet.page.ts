import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { completeForumDet } from 'src/models/completeForumDet';
import { ForumService } from '../forum/forum.services';
import { forumDataModel } from 'src/models/forumDataModel';
import { ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forumdet',
  templateUrl: './forumdet.page.html',
  styleUrls: ['./forumdet.page.scss'],
})
export class ForumdetPage implements OnDestroy {
  f: completeForumDet = new completeForumDet;
  isSubmitted:boolean = false;
  forumDataModel = new forumDataModel;
  idCategoria: number = 0;
  idPadre: number = 0;
  errors:boolean = false;
  preload: boolean = true;
  forumId: number | null = null;
  forumName: string | null = null;

  event = {};
  constructor(private forumService: ForumService, public fb: FormBuilder, private router: Router) {
 
  }

  ionicForm = this.fb.group({
    nome: ['', [Validators.required]],
    cognome: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$')]],
    titolo: ['', [Validators.required]],
    citta: ['', [Validators.required]],
    contenuto: ['', [Validators.required]]
  });

  ionViewWillEnter() {
    let forumIdStr = localStorage.getItem('forumId');
    let forumId = forumIdStr !== null ? parseInt(forumIdStr) : 0;

    console.log(forumIdStr);

    this.getForum(forumId); 
    this.HidePost();

  }

    ShowNewPost(){
      document.getElementById("new-post-det")!.style.display = "block";
    };

    HidePost(){
      document.getElementById("new-post-det")!.style.display = "none";
    };
    
  ngOnDestroy() {
    localStorage.removeItem('forumId');
  }

  gotoForum(){
    localStorage.setItem('forumsId', this.forumId!.toString() );
    localStorage.setItem('forumName', this.forumName!);
    this.router.navigate(['forum']);
  }

  getForum(forumId: number) {
     this.forumService.getForum(forumId).subscribe(
      response => {
        this.preload = false;
        this.f = JSON.parse(JSON.stringify(response));
        this.idCategoria = this.f.categoria.id!;
        this.idPadre = this.f.forum.id;
        this.forumId = this.f.forum.id;
        this.forumName = this.f.forum.titolo;
      },
      error => {
         console.log('oops', error);
      }
    );
  }


  get errorControl() {
    return this.ionicForm.controls;
  }

  submitDet():void{
    this.isSubmitted = true;
    if (!this.ionicForm.valid) {
       return;
    } 
    else 
    {
    
      this.forumDataModel.titolo = this.ionicForm.value.titolo!;
      this.forumDataModel.idCategoria =  this.idCategoria;
      this.forumDataModel.descrizione = this.ionicForm.value.contenuto!;
      this.forumDataModel.immagine = "";
      this.forumDataModel.idPadre = this.idPadre;
      this.forumDataModel.citta = this.ionicForm.value.citta!;
      this.forumDataModel.keywords = "";
      this.forumDataModel.description = "";
      this.forumDataModel.subCategories = "";
      this.forumDataModel.nome = this.ionicForm.value.nome!;
      this.forumDataModel.cognome = this.ionicForm.value.cognome!;
      this.forumDataModel.email = this.ionicForm.value.email!;

      this.errors = false;
      this.forumService.postNewForum(this.forumDataModel).subscribe(
        response => {
          console.log(response);
          if(response.status === true){
            this.HidePost();
            let forumIdStr = localStorage.getItem('forumId');
            let forumId = forumIdStr !== null ? parseInt(forumIdStr) : 0;
            this.getForum(forumId);
          }
          else{
            this.errors = true;
          }
        },
        error => {
          console.log('oops', error);
        })
    }
  }
}
