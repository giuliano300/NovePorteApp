import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { event } from 'jquery';
import { categorieForum } from 'src/models/categorieForum';
import { completeForum } from 'src/models/completeForum';
import { forumDataModel } from 'src/models/forumDataModel';
import { ForumService } from './forum.services';

@Component({
  selector: 'app-forum',
  templateUrl: './forum.page.html',
  styleUrls: ['./forum.page.scss'],
})
export class ForumPage implements OnInit, OnDestroy {
  idCategoria: number  = 0;
  forum: completeForum[] = [];
  categorieForum: categorieForum[] = [];
  forumDataModel: forumDataModel = new forumDataModel();
  forumName: string = "";
  notSubs: boolean = false;
  public fileData: File | undefined;
  public fileUploadProgress: string = "";
  public uploadedFilePath: string = "";
  public pathPhoto: any = null;

  isSubmitted:boolean = false;
  isValid:boolean= false;
  errors:boolean = false;
  preload: boolean = true;
  selectedCategory: any;

  constructor(private router: Router, public fb: FormBuilder,
    private forumService: ForumService) { 
     
    }

  ionicForm = this.fb.group({
    nome: ['', [Validators.required]],
    cognome: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$')]],
    titolo: ['', [Validators.required]],
    citta: ['', [Validators.required]],
    subs: ['', [Validators.required]],
    file: ['', [Validators.required]],
    contenuto: ['', [Validators.required]]
  });
    


  ngOnInit() {



    let idCategoriaStr = localStorage.getItem('forumsId');
    let idCategoria = idCategoriaStr !== null ? parseInt(idCategoriaStr) : 0;
    this.idCategoria = idCategoria;

    let forumName = localStorage.getItem('forumName') || "";

    if(idCategoria != 11 && idCategoria != 86)
      this.forumName = "Laboratorio della porta " + localStorage.getItem('forumName');
    else
    {
      this.notSubs = true;
      this.forumName = forumName;
    }
    
    this.getForums(idCategoria);   
    this.getCategorieForum(idCategoria);   
    this.getForums(idCategoria);
  }

  ngOnDestroy() {
    localStorage.removeItem('forumsId');
    localStorage.removeItem('forumName');
  }

  getForums(idCategoria: number) {
    this.forum = [];
    this.forumService.getForums(idCategoria).subscribe(
      response => {
        this.preload = false;
        this.forum = JSON.parse(JSON.stringify(response));
      },
      error => {
        console.log('oops', error);
      }
    );
  }

  getCategorieForum(idCategoria: number) {
     this.categorieForum = [];
     this.forumService.getCategorieForum(idCategoria).subscribe(
      response => {
        this.categorieForum = JSON.parse(JSON.stringify(response));
      },
      error => {
          console.log('oops', error);
      }
    );
  }

  gotoForum(id:number) {
    localStorage.setItem('forumId', id.toString());
    this.router.navigate(['forumdet']);
  }

  ShowNewPost(){
    document.getElementById("new-post")!.style.display = "block";
  };

  HidePost(){
    document.getElementById("new-post")!.style.display = "none";
  };

  truncateChar(text: string, charlimit: number): string {
    if(!text || text.length <= charlimit )
    {
        return text;
    }

    let without_html = text.replace(/<(?:.|\n)*?>/gm, '');
    let shortened = without_html.substring(0, charlimit) + "...";
    return shortened;
  }

  onChange(selectedValue: any) {
    let id = selectedValue;
    this.getForums(id);
  }

  fileProgress(fileInput: any) {
    this.fileData = <File>fileInput.target.files[0];
    var reader = new FileReader();
    reader.readAsDataURL(this.fileData);
    reader.onload = (_event) => {
      this.pathPhoto = reader.result;
    }
  }

  get errorControl() {
    return this.ionicForm.controls;
  }

  submit(): void{
    this.isSubmitted = true;
    if (!this.ionicForm.valid) {
       return;
    } 
    else 
    {
      let s = "";
      let i = this.ionicForm.value.subs || "";

      for(var x=0; x < i.length; x++){
        s += i[x] + ",";
      }
      if(s != "")
        s = s.substr(0, s.length - 1);  

      this.forumDataModel.titolo = this.ionicForm.value.titolo!;
      this.forumDataModel.idCategoria = this.idCategoria;
      this.forumDataModel.descrizione = this.ionicForm.value.contenuto!;
      this.forumDataModel.immagine = this.pathPhoto;
      this.forumDataModel.idPadre = 0;
      this.forumDataModel.citta = this.ionicForm.value.citta!;
      this.forumDataModel.keywords = "";
      this.forumDataModel.description = "";
      this.forumDataModel.subCategories = s;
      this.forumDataModel.nome = this.ionicForm.value.nome!;
      this.forumDataModel.cognome = this.ionicForm.value.cognome!;
      this.forumDataModel.email = this.ionicForm.value.email!;

      this.errors = false;
      this.forumService.postNewForum(this.forumDataModel).subscribe(
        response => {
          console.log(response);
          if(response.status === true){
            this.HidePost();
            let idCategoriaStr = localStorage.getItem('forumsId');
            let idCategoria = idCategoriaStr !== null ? parseInt(idCategoriaStr) : 0;
            this.getForums(idCategoria);
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
