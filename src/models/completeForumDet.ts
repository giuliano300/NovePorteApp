import { categorieForum } from "./categorieForum";
import { completeForum } from "./completeForum";
import { forum } from "./forum";
import { risposteForum } from "./risposteForum";
import { utentiForum } from "./utentiForum";

export class completeForumDet {
    forum: forum = new forum;
    categoria:categorieForum = new categorieForum;
    utente:utentiForum = new utentiForum;
    risposte:risposteForum[] = [];
    numeroInterventi?: number;
}